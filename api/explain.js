const openai = require('./openai');
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

const { parseForm, extractTextFromFile } = require('./extract-utils');

// Server-side PDF/DOCX/TXT parsing only. Image OCR is not enabled on Vercel by default.

// Redis support removed — always use in-memory rate limiter

// In-memory fallback
const rateMap = new Map(); // clientKey => [timestamps]

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
  const timestamps = (rateMap.get(clientKey) || []).filter((ts) => ts > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) };
  }
  timestamps.push(now);
  rateMap.set(clientKey, timestamps);
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
  const rl = await checkRateLimit(clientKey);
  if (!rl.ok) {
    res.setHeader('Retry-After', Math.ceil(rl.retryAfter || RATE_LIMIT_WINDOW_MS / 1000));
    return res.status(429).json({ error: 'Za dużo żądań. Spróbuj ponownie później.' });
  }

  let text = '';

  try {
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
        return res.status(400).json({ error: 'Nieprawidłowy format formularza. Upewnij się, że wysyłasz multipart/form-data.' });
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
          return res.status(400).json({ error: 'Nie udało się odczytać pliku. Upewnij się, że plik jest prawidłowy.' });
        }

        // If no text extracted and an OCR worker is configured, forward the file to the OCR worker
        if ((!text || !String(text).trim()) && process.env.OCR_WORKER_URL) {
          try {
            const OCR_URL = String(process.env.OCR_WORKER_URL).replace(/\/+$/, '') + '/process';
            const fs = require('fs');
            // prefer file path when available
            const filepath = file.filepath || file.path || file.tempFilePath || file.tempFile || file.file;
            let formBody = null;

            // Use global FormData when available (Node 18+), otherwise fall back to form-data package
            const FormDataCtor = global.FormData || (() => { try { return require('form-data'); } catch (e) { return null; } })();

            if (filepath && typeof filepath === 'string' && fs.existsSync(filepath) && FormDataCtor) {
              const stream = fs.createReadStream(filepath);
              formBody = new FormDataCtor();
              if (typeof formBody.append === 'function') formBody.append('file', stream, file.originalFilename || file.name || 'file');
            } else if ((file.buffer || file.data) && FormDataCtor) {
              const buf = file.buffer || file.data;
              formBody = new FormDataCtor();
              if (typeof formBody.append === 'function') formBody.append('file', buf, file.originalFilename || file.name || 'file');
            }

            if (formBody) {
              const headers = typeof formBody.getHeaders === 'function' ? formBody.getHeaders() : {};
              const resp = await fetch(OCR_URL, { method: 'POST', headers, body: formBody });
              if (resp.ok) {
                const json = await resp.json().catch(() => null);
                if (json && json.text) text = json.text;
                else if (json && json.result && json.result.text) text = json.result.text;
              } else {
                console.error('OCR worker responded with', resp.status);
              }
            }
          } catch (e) {
            console.error('OCR worker forwarding error:', e && e.stack ? e.stack : e);
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
    const explanation = result && result.explanation;
    const usage = result && result.usage;
    const usedModel = (result && result.model) || process.env.OPENAI_MODEL || null;
    const usedFallback = !!(result && result.fallback);
    return res.status(200).json({ explanation, usage, usedModel, usedFallback });
  } catch (error) {
    console.error('Error in /api/explain:', error);


    const isRateLimit =
      error && error.message &&
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
      error && (error.code === 'OPENAI_TIMEOUT' || error.name === 'AbortError' ||
        (error.message && error.message.toLowerCase().includes('timed out')));
    if (isTimeout) {
      res.setHeader('Retry-After', '30');
      return res.status(504).json({ error: 'Żądanie do OpenAI wygasło. Spróbuj ponownie później.' });
    }

    // Organization not verified error from OpenAI (common when using newer models)
    if (error && error.code === 'ORG_UNVERIFIED') {
      const suggestedModel = process.env.OPENAI_FALLBACK_MODEL || 'gpt-3.5-turbo';
      return res.status(403).json({
        error:
          'Twoja organizacja nie jest zweryfikowana do korzystania z wybranego modelu OpenAI. Zaloguj się na https://platform.openai.com/settings/organization/general i zweryfikuj organizację, lub ustaw inny model w zmiennej OPENAI_MODEL.',
        suggestedModel
      });
    }

    return res.status(500).json({
      error: 'Wystąpił błąd serwera podczas generowania wyjaśnienia. Spróbuj ponownie później.',
    });
  }
};
