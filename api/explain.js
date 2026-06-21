const openai = require('./openai');
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

const { parseForm, extractTextFromFile } = require('./extract-utils');
const metrics = require('./metrics');

// Server-side PDF/DOCX/TXT parsing only. Image OCR is not enabled on Vercel by default.

// Redis support removed — always use in-memory rate limiter

// In-memory fallback
const rateMap = new Map(); // clientKey => [timestamps]

// Optional Upstash/Redis support via env vars. If UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN are set, use Upstash REST API for serverless-friendly rate limiting.
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || null;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || null;
const REDIS_URL = process.env.REDIS_URL || null;
let ioredisClient = null;
if (REDIS_URL) {
  try {
    // lazy require ioredis
    // eslint-disable-next-line global-require
    const IORedis = require('ioredis');
    ioredisClient = new IORedis(REDIS_URL);
  } catch (e) {
    console.warn('ioredis not available or failed to connect (safe):', e && e.message ? e.message : e);
    ioredisClient = null;
  }
}

function getClientKey(req) {
  if (req && req.headers) {
    const fwd = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
    if (fwd) return String(fwd).split(',')[0].trim();
  }
  if (req && req.connection && req.connection.remoteAddress) return req.connection.remoteAddress;
  if (req && req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
  return null;
}

async function checkRateLimit(clientKey) {
  if (!clientKey) return { ok: true };

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  // If a Redis URL is configured, prefer server-backed rate limiting using ioredis.
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  if (ioredisClient) {
    const bucket = `rl:${clientKey}:${Math.floor(now / RATE_LIMIT_WINDOW_MS)}`;
    // Retry with exponential backoff to tolerate transient errors
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const count = await ioredisClient.incr(bucket);
        if (count === 1) await ioredisClient.expire(bucket, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
        if (count > RATE_LIMIT_MAX) return { ok: false, retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) };
        return { ok: true };
      } catch (err) {
        // If last attempt, log and continue to fallback
        if (attempt >= 2) {
          console.error('Rate limiter Redis error (safe):', err && err.message ? err.message : err);
        } else {
          // backoff and retry
          // eslint-disable-next-line no-await-in-loop
          await sleep(Math.pow(2, attempt) * 100);
        }
      }
    }
    // if redis path failed, fall through to Upstash or in-memory fallback
  }

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const bucket = `rl:${clientKey}:${Math.floor(now / RATE_LIMIT_WINDOW_MS)}`;
      const body = `{"cmd":"incr","key":"${bucket}"}`; // minimal command body
      // Upstash supports multiple ways; use simple REST increment via fetch
      const resp = await fetch(UPSTASH_URL + `/incr/${encodeURIComponent(bucket)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      if (resp.ok) {
        const text = await resp.text().catch(() => null);
        const count = Number(text) || 0;
        if (count === 1) {
          // set TTL for the bucket (seconds)
          try {
            await fetch(UPSTASH_URL + `/expire/${encodeURIComponent(bucket)}/${Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
            });
          } catch (e) {
            // ignore ttl set failure
          }
        }
        if (count > RATE_LIMIT_MAX) return { ok: false, retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) };
        return { ok: true };
      }
    } catch (e) {
      console.error('Rate limiter Upstash error (safe):', e && e.message ? e.message : e);
      // fall through to in-memory fallback
    }
  }

  const timestamps = (rateMap.get(clientKey) || []).filter((ts) => ts > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    metrics.inc('rate_limit.blocked');
    return { ok: false, retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) };
  }
  timestamps.push(now);
  rateMap.set(clientKey, timestamps);
  metrics.inc('rate_limit.allowed');
  return { ok: true };
}

// parseForm and extractTextFromFile moved to ./extract-utils
// (see api/extract-utils.js)

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
  }

  // rate limiting
  const clientKey = getClientKey(req);
  metrics.inc('request.incoming');
  const rl = await checkRateLimit(clientKey);
  if (!rl.ok) {
    metrics.inc('request.rejected_rate');
    res.setHeader('Retry-After', Math.ceil(rl.retryAfter || RATE_LIMIT_WINDOW_MS / 1000));
    return res.status(429).json({ error: 'Za dużo żądań. Spróbuj ponownie później.' });
  }

  let text = '';

    try {
      metrics.inc('request.process.start');
    const headers = req.headers || {};
    const contentType = (headers['content-type'] || headers['Content-Type'] || '').toLowerCase();

    if (contentType.includes('multipart/form-data')) {
      // parse form safely and handle parse errors explicitly
      let fields, files;
      try {
        const parsed = await parseForm(req);
        fields = parsed.fields;
        files = parsed.files;
      } catch (e) {
        console.error('Form parse error in /api/explain:', e && e.stack ? e.stack : e);
        return res.status(400).json({
          error: 'Nieprawidłowy format formularza. Upewnij się, że wysyłasz multipart/form-data.',
        });
      }

      text = (fields && fields.text) || '';
      // Normalize field types (some parsers return arrays)
      if (Array.isArray(text)) {
        text = text.join('\n');
      } else if (typeof text === 'object' && text !== null) {
        text = String(text);
      }
      const file = files && (files.documentFile || files.file || Object.values(files)[0]);
      // If text is empty or whitespace, prefer extracting from file when available
      if ((!text || !String(text).trim()) && file) {
        try {
          text = await extractTextFromFile(file);
        } catch (e) {
          console.error('File extraction error in /api/explain:', e && e.stack ? e.stack : e);
          return res
            .status(400)
            .json({ error: 'Nie udało się odczytać pliku. Upewnij się, że plik jest prawidłowy.' });
        }

        // If no text extracted and an OCR worker is configured, forward the file to the OCR worker
    if ((!text || !String(text).trim()) && process.env.OCR_WORKER_URL) {
          try {
            const raw = String(process.env.OCR_WORKER_URL).replace(/\/+$/, '');
            if (!raw.startsWith('https://')) {
              console.warn('OCR_WORKER_URL must be https; skipping forward');
            } else {
              const OCR_URL = raw + '/process';
              const fs = require('fs');
              const filepath = file.filepath || file.path || file.tempFilePath || file.tempFile || file.file;
              let formBody = null;

              const FormDataCtor =
                global.FormData ||
                (() => {
                  try {
                    return require('form-data');
                  } catch (e) {
                    return null;
                  }
                })();

              if (
                filepath &&
                typeof filepath === 'string' &&
                fs.existsSync(filepath) &&
                FormDataCtor
              ) {
                const stream = fs.createReadStream(filepath);
                formBody = new FormDataCtor();
                if (typeof formBody.append === 'function')
                  formBody.append('file', stream, file.originalFilename || file.name || 'file');
              } else if ((file.buffer || file.data) && FormDataCtor) {
                const buf = file.buffer || file.data;
                // Prevent sending very large buffers to worker
                if (Buffer.byteLength(buf) <= 5 * 1024 * 1024) {
                  formBody = new FormDataCtor();
                  if (typeof formBody.append === 'function')
                    formBody.append('file', buf, file.originalFilename || file.name || 'file');
                }
              }

              if (formBody) {
                const headers = typeof formBody.getHeaders === 'function' ? formBody.getHeaders() : {};
                const controller = new AbortController();
                const t = setTimeout(() => controller.abort(), Number(process.env.OCR_WORKER_TIMEOUT_MS || 20000));
                try {
                  const resp = await fetch(OCR_URL, { method: 'POST', headers, body: formBody, signal: controller.signal });
                  clearTimeout(t);
                  if (resp.ok) {
                    const json = await resp.json().catch(() => null);
                    if (json && json.text) text = json.text;
                    else if (json && json.result && json.result.text) text = json.result.text;
                  } else {
                    console.error('OCR worker responded with status', resp.status);
                  }
                } catch (e) {
                  clearTimeout(t);
                  console.error('OCR worker forwarding error (safe):', e && e.message ? e.message : e);
                }
              }
            }
          } catch (e) {
            console.error('OCR worker forwarding outer error (safe):', e && e.message ? e.message : e);
          }
        }
      }
    } else {
      // JSON body
      const body = req.body || {};
      text = body.text || '';
    }

    const extractOnly = headers && (headers['x-extract-only'] || headers['X-Extract-Only']);
    if (extractOnly) {
      return res.status(200).json({ extractedText: text || '' });
    }

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Proszę wkleić treść pisma do przetworzenia.' });
    }

    if (text.length > 5000) {
      return res
        .status(413)
        .json({ error: `Tekst przekracza maksymalną dozwoloną długość ${5000} znaków.` });
    }

     const result = await openai.generateExplanation(text.trim());
     metrics.inc('openai.calls');
    const explanation = result && result.explanation;
    const usage = result && result.usage;
    const usedModel = (result && result.model) || process.env.OPENAI_MODEL || null;
    const usedFallback = !!(result && result.fallback);
    return res.status(200).json({ explanation, usage, usedModel, usedFallback });
  } catch (error) {
    console.error('Error in /api/explain:', error);

    const isRateLimit =
      error &&
      error.message &&
      (error.message.includes('Too Many Requests') ||
        error.message.includes('rate limit') ||
        error.message.includes('429'));

    if (isRateLimit) {
      res.setHeader('Retry-After', '60');
      return res
        .status(429)
        .json({ error: 'OpenAI API rate limit exceeded. Spróbuj ponownie za chwilę.' });
    }

    const isTimeout =
      error &&
      (error.code === 'OPENAI_TIMEOUT' ||
        error.name === 'AbortError' ||
        (error.message && error.message.toLowerCase().includes('timed out')));
    if (isTimeout) {
      res.setHeader('Retry-After', '30');
      return res
        .status(504)
        .json({ error: 'Żądanie do OpenAI wygasło. Spróbuj ponownie później.' });
    }

    // Organization not verified error from OpenAI (common when using newer models)
    if (error && error.code === 'ORG_UNVERIFIED') {
      const suggestedModel = process.env.OPENAI_FALLBACK_MODEL || 'gpt-3.5-turbo';
      return res.status(403).json({
        error:
          'Twoja organizacja nie jest zweryfikowana do korzystania z wybranego modelu OpenAI. Zaloguj się na https://platform.openai.com/settings/organization/general i zweryfikuj organizację, lub ustaw inny model w zmiennej OPENAI_MODEL.',
        suggestedModel,
      });
    }

    return res.status(500).json({
      error: 'Wystąpił błąd serwera podczas generowania wyjaśnienia. Spróbuj ponownie później.',
    });
  }
};
