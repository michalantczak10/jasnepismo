let openai = require('./openai');
// allow tests or runtime to swap provider by mutating the exported module
try { if (!openai) openai = require('./openai'); } catch (e) {}
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

const fs = require('fs');
const formidable = require('formidable');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

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

function makeForm(options) {
  // support multiple formidable API shapes across versions
  try {
    if (typeof formidable === 'function') return formidable(options);
    if (formidable && typeof formidable.formidable === 'function') return formidable.formidable(options);
    if (formidable && typeof formidable.IncomingForm === 'function') return new formidable.IncomingForm(options);
  } catch (e) {
    // fallthrough
  }
  throw new Error('formidable library not available or has unexpected API shape');
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    let form;
    try {
      form = makeForm({ multiples: false });
    } catch (e) {
      return reject(e);
    }
    // Some form implementations (IncomingForm) may not support .parse returning files in same shape
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}



async function extractTextFromFile(file) {
  if (!file) return '';
  const filepath = file.filepath || file.path || file.file;
  const name = file.originalFilename || file.name || '';
  const type = (file.mimetype || file.type || '').toLowerCase();

  const buffer = fs.readFileSync(filepath);

  if (type.includes('pdf') || name.toLowerCase().endsWith('.pdf')) {
    try {
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (e) {
      console.error('PDF parse error:', e);
      return '';
    }
  }

  if (name.toLowerCase().endsWith('.docx') || type.includes('word')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result && result.value ? result.value : '';
    } catch (e) {
      console.error('Mammoth parse error:', e);
      return '';
    }
  }

  if (type === 'text/plain' || name.toLowerCase().endsWith('.txt')) {
    return buffer.toString('utf8');
  }

  // Image handling not supported server-side in this configuration
  return '';
}

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
      const file = files && (files.documentFile || files.file || Object.values(files)[0]);
      if (!text && file) {
        try {
          text = await extractTextFromFile(file);
        } catch (e) {
          console.error('File extraction error in /api/explain:', e && e.stack ? e.stack : e);
          return res.status(400).json({ error: 'Nie udało się odczytać pliku. Upewnij się, że plik jest prawidłowy.' });
        }
      }
    } else {
      // JSON body
      const body = req.body || {};
      text = body.text || '';
    }

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Proszę wkleić treść pisma do przetworzenia.' });
    }

    if (text.length > 5000) {
      return res
        .status(413)
        .json({ error: `Tekst przekracza maksymalną dozwoloną długość ${5000} znaków.` });
    }

    const { explanation, usage } = await openai.generateExplanation(text.trim());
    return res.status(200).json({ explanation, usage });
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

    return res.status(500).json({
      error: 'Wystąpił błąd serwera podczas generowania wyjaśnienia. Spróbuj ponownie później.',
    });
  }
};
