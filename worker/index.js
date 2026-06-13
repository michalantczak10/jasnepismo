const express = require('express');
const cors = require('cors');
const formidable = require('formidable');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { createWorker } = require('tesseract.js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const ENABLE_TESSERACT = true; // worker is dedicated to OCR
const TESS_LANGS = (process.env.TESSERACT_LANGS || 'pol,eng').split(',').map(s => s.trim()).filter(Boolean);

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
  const worker = createWorker({ logger: m => {} });
  try {
    await worker.load();
    for (const lang of TESS_LANGS) {
      try {
        await worker.loadLanguage(lang);
        await worker.initialize(lang);
        const { data } = await worker.recognize(buffer);
        await worker.terminate();
        return (data && data.text) || '';
      } catch (e) {
        console.error('Tesseract failed for', lang, e);
      }
    }
    await worker.terminate();
  } catch (e) {
    console.error('Tesseract worker error', e);
    try { await worker.terminate(); } catch (er) {}
  }
  return '';
}

async function extractTextFromFileObject(file) {
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

  if (type.startsWith('image/') || name.match(/\.(jpe?g|png|tiff?|bmp|gif)$/i)) {
    try {
      if (ENABLE_TESSERACT) {
        return await ocrImageBuffer(buffer);
      }
    } catch (e) {
      console.error('OCR error:', e);
    }
  }

  return '';
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/process', async (req, res) => {
  try {
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Use multipart/form-data with a file field.' });
    }
    const { fields, files } = await parseForm(req);
    const file = files && (files.documentFile || files.file || Object.values(files)[0]);
    const textFromBody = (fields && fields.text) || '';
    let text = textFromBody || '';
    if (!text && file) {
      text = await extractTextFromFileObject(file);
    }
    return res.json({ text: text || '' });
  } catch (e) {
    console.error('Worker error:', e);
    return res.status(500).json({ error: 'Worker error' });
  }
});

app.listen(PORT, () => console.log(`OCR worker listening on ${PORT}`));
