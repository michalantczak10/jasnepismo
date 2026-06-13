const openai = require('./openai');
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

const fs = require('fs');
const formidable = require('formidable');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { createWorker } = require('tesseract.js');

// Toggle server-side OCR with env var ENABLE_SERVER_OCR=true
const ENABLE_SERVER_OCR = String(process.env.ENABLE_SERVER_OCR || '').toLowerCase() === 'true';
const TESSERACT_LANGS = (process.env.TESSERACT_LANGS || 'pol,eng').split(',').map((s) => s.trim()).filter(Boolean);

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

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

async function ocrImageBuffer(buffer) {
  if (!ENABLE_SERVER_OCR) return '';
  const worker = createWorker({ logger: () => {} });
  try {
    await worker.load();
    for (const lang of TESSERACT_LANGS) {
      try {
        await worker.loadLanguage(lang);
        await worker.initialize(lang);
        const { data } = await worker.recognize(buffer);
        await worker.terminate();
        return (data && data.text) || '';
      } catch (e) {
        console.error(`Tesseract (${lang}) recognition error:`, e);
        // try next language
      }
    }
    await worker.terminate();
  } catch (e) {
    console.error('Tesseract worker error:', e);
    try {
      await worker.terminate();
    } catch (er) {}
  }
  return '';
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

  // Image handling — attempt server-side OCR if enabled
  if (type.startsWith('image/') || name.match(/\.(jpe?g|png|tiff?|bmp|gif)$/i)) {
    if (!ENABLE_SERVER_OCR) {
      return '';
    }
    try {
      const text = await ocrImageBuffer(buffer);
      return text || '';
    } catch (e) {
      console.error('OCR error:', e);
      return '';
    }
  }

  // Other types not handled server-side
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
    const contentType = (req.headers['content-type'] || req.headers['Content-Type'] || '').toLowerCase();

    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseForm(req);
      text = (fields && fields.text) || '';

      const file = files && (files.documentFile || files.file || Object.values(files)[0]);
      if (!text && file) {
        text = await extractTextFromFile(file);
      }
    } else {
      // JSON body
      const body = req.body || {};
      text = body.text || '';
    }

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Proszę wkleić treść pisma do przetworzenia lub dołączyć plik z tekstem.' });
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
