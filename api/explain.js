const openai = require('./openai');
const { parseForm, extractTextFromFile } = require('./extract-utils');
const metrics = require('./metrics');
const { checkRateLimit } = require('./rate-limit');
const { validateEnvironment } = require('./env-validation');
const crypto = require('crypto');

function generateRequestId() {
  return crypto.randomBytes(4).toString('hex');
}

// Server-side PDF/DOCX/TXT parsing only. Image OCR is not enabled on Vercel by default.

// Validate environment on startup
validateEnvironment();

function getClientKey(req) {
  if (req && req.headers) {
    const fwd = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
    if (fwd) return String(fwd).split(',')[0].trim();
  }
  if (req && req.connection && req.connection.remoteAddress) return req.connection.remoteAddress;
  if (req && req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
  return null;
}

// parseForm and extractTextFromFile moved to ./extract-utils
// (see api/extract-utils.js)

module.exports = async function handler(req, res) {
  const requestId = generateRequestId();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.', requestId });
  }

  // rate limiting
  const clientKey = getClientKey(req);
  metrics.inc('request.incoming');
  const rl = await checkRateLimit(clientKey);
  if (!rl.ok) {
    metrics.inc('request.rejected_rate');
    res.setHeader('Retry-After', Math.ceil(rl.retryAfter || 60));
    return res.status(429).json({ error: 'Za dużo żądań. Spróbuj ponownie później.', requestId });
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
          requestId,
        });
      }

      text = (fields && fields.text) || '';
      // Normalize field types (some parsers return arrays)
      if (Array.isArray(text)) {
        text = text.join('\n');
      } else if (typeof text === 'object' && text !== null) {
        text = String(text);
      }
      // Collect all files (support multi-file upload via field name 'file')
      let allFiles = [];
      if (files) {
        const raw = files.file;
        if (raw) {
          allFiles = Array.isArray(raw) ? raw : [raw];
          // Sort by original filename for consistent concatenation order
          allFiles.sort(function (a, b) {
            var na = (a.originalFilename || a.name || '').toLowerCase();
            var nb = (b.originalFilename || b.name || '').toLowerCase();
            return na.localeCompare(nb);
          });
        }
      }

      // If text is empty or whitespace, extract from file(s)
      if ((!text || !String(text).trim()) && allFiles.length > 0) {
        var extractedParts = [];
        var extractionError = false;
        for (var fi = 0; fi < allFiles.length; fi++) {
          var f = allFiles[fi];
          try {
            var part = await extractTextFromFile(f);
            if (part) extractedParts.push(part);
          } catch (e) {
            console.error('File extraction error in /api/explain:', e && e.stack ? e.stack : e);
            extractionError = true;
          }
        }

        if (extractionError && extractedParts.length === 0) {
          return res
            .status(400)
            .json({ error: 'Nie udało się odczytać pliku. Upewnij się, że plik jest prawidłowy.' });
        }

        text = extractedParts.join('\n');

        // If no text extracted and an OCR worker is configured, forward the single file to the OCR worker
        if ((!text || !String(text).trim()) && allFiles.length === 1 && process.env.OCR_WORKER_URL) {
          var file = allFiles[0];
          try {
            const raw2 = String(process.env.OCR_WORKER_URL).replace(/\/+$/, '');
            if (!raw2.startsWith('https://')) {
              console.warn('OCR_WORKER_URL must be https; skipping forward');
            } else {
              var OCR_URL = raw2 + '/process';
              var fs2 = require('fs');
              var filepath2 =
                file.filepath || file.path || file.tempFilePath || file.tempFile || file.file;
              var formBody2 = null;

              var FormDataCtor2 =
                global.FormData ||
                (function () {
                  try {
                    return require('form-data');
                  } catch (e) {
                    return null;
                  }
                })();

              if (
                filepath2 &&
                typeof filepath2 === 'string' &&
                fs2.existsSync(filepath2) &&
                FormDataCtor2
              ) {
                var stream2 = fs2.createReadStream(filepath2);
                formBody2 = new FormDataCtor2();
                if (typeof formBody2.append === 'function')
                  formBody2.append('file', stream2, file.originalFilename || file.name || 'file');
              } else if ((file.buffer || file.data) && FormDataCtor2) {
                var buf2 = file.buffer || file.data;
                if (Buffer.byteLength(buf2) <= 5 * 1024 * 1024) {
                  formBody2 = new FormDataCtor2();
                  if (typeof formBody2.append === 'function')
                    formBody2.append('file', buf2, file.originalFilename || file.name || 'file');
                }
              }

              if (formBody2) {
                var headers2 =
                  typeof formBody2.getHeaders === 'function' ? formBody2.getHeaders() : {};
                var controller2 = new AbortController();
                var t2 = setTimeout(
                  function () { controller2.abort(); },
                  Number(process.env.OCR_WORKER_TIMEOUT_MS || 20000)
                );
                try {
                  var resp2 = await fetch(OCR_URL, {
                    method: 'POST',
                    headers: headers2,
                    body: formBody2,
                    signal: controller2.signal,
                  });
                  clearTimeout(t2);
                  if (resp2.ok) {
                    var json2 = await resp2.json().catch(function () { return null; });
                    if (json2 && json2.text) text = json2.text;
                    else if (json2 && json2.result && json2.result.text) text = json2.result.text;
                  } else {
                    console.error('OCR worker responded with status', resp2.status);
                  }
                } catch (e2) {
                  clearTimeout(t2);
                  console.error(
                    'OCR worker forwarding error (safe):',
                    e2 && e2.message ? e2.message : e2
                  );
                }
              }
            }
          } catch (e3) {
            console.error(
              'OCR worker forwarding outer error (safe):',
              e3 && e3.message ? e3.message : e3
            );
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

    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Proszę wkleić treść pisma do przetworzenia.', requestId });
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return res.status(400).json({ error: 'Proszę wkleić treść pisma do przetworzenia.', requestId });
    }

    if (trimmedText.length > 15000) {
      return res
        .status(413)
        .json({ error: `Tekst przekracza maksymalną dozwoloną długość ${15000} znaków.`, requestId });
    }

    if (text !== trimmedText) {
      metrics.inc('text.normalized');
    }

    const result = await openai.generateExplanation(text.trim());
    metrics.inc('openai.calls');
    const explanation = result && result.explanation;
    const usage = result && result.usage;
    const usedModel = (result && result.model) || process.env.OPENAI_MODEL || null;
    const usedFallback = !!(result && result.fallback);
    return res.status(200).json({ explanation, usage, usedModel, usedFallback });
  } catch (error) {
    console.error('Error in /api/explain [%s]:', requestId, error);

    const errMsg = (error && error.message) || '';
    const errLower = errMsg.toLowerCase();
    const errStatus = error && error.status;

    const isRateLimit =
      errStatus === 429 ||
      errLower.includes('too many requests') ||
      errLower.includes('rate limit') ||
      errLower.includes('429');

    if (isRateLimit) {
      res.setHeader('Retry-After', '60');
      return res
        .status(429)
        .json({ error: 'OpenAI API rate limit exceeded. Spróbuj ponownie za chwilę.', requestId });
    }

    if (errStatus === 401 || errLower.includes('incorrect api key') || errLower.includes('invalid api key') || errLower.includes('api key')) {
      return res.status(500).json({
        error: 'Klucz API OpenAI jest nieprawidłowy lub wygasł. Sprawdź zmienną środowiskową OPENAI_API_KEY.',
        requestId,
      });
    }

    if (errLower.includes('quota') || errLower.includes('insufficient') || errLower.includes('exceeded your current quota')) {
      return res.status(500).json({
        error: 'Limit zapytań do OpenAI został wyczerpany. Doładuj konto w panelu OpenAI.',
        requestId,
      });
    }

    const isTimeout =
      error &&
      (error.code === 'OPENAI_TIMEOUT' ||
        error.name === 'AbortError' ||
        errLower.includes('timed out'));
    if (isTimeout) {
      res.setHeader('Retry-After', '30');
      return res
        .status(504)
        .json({ error: 'Żądanie do OpenAI wygasło. Spróbuj ponownie później.', requestId });
    }

    if (errLower.includes('model') && (errLower.includes('not found') || errLower.includes('does not exist') || errLower.includes('not supported'))) {
      const model = process.env.OPENAI_MODEL || 'nieznany';
      return res.status(500).json({
        error: `Model "${model}" nie jest dostępny. Sprawdź zmienną OPENAI_MODEL.`,
        requestId,
      });
    }

    if (error && error.code === 'ORG_UNVERIFIED') {
      const suggestedModel = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini';
      return res.status(403).json({
        error:
          'Twoja organizacja nie jest zweryfikowana do korzystania z wybranego modelu OpenAI. Zaloguj się na https://platform.openai.com/settings/organization/general i zweryfikuj organizację, lub ustaw inny model w zmiennej OPENAI_MODEL.',
        suggestedModel,
        requestId,
      });
    }

    return res.status(500).json({
      error: 'Wystąpił błąd serwera podczas generowania wyjaśnienia. Spróbuj ponownie później.',
      requestId,
    });
  }
};
