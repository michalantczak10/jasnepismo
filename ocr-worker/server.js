const http = require('http');
const formidable = require('formidable');
const { createWorker } = require('tesseract.js');

const PORT = parseInt(process.env.PORT, 10) || 3001;
const OCR_TIMEOUT_MS = parseInt(process.env.OCR_TIMEOUT_MS, 10) || 30000;

async function extractText(buffer) {
  const worker = await createWorker();
  try {
    await worker.reinitialize('pol');
  } catch {
    try {
      await worker.reinitialize('eng');
    } catch {
      // languages not available
    }
  }
  const timer = setTimeout(() => worker.terminate(), OCR_TIMEOUT_MS);
  try {
    const { data } = await worker.recognize(buffer);
    return data && data.text ? data.text : '';
  } finally {
    clearTimeout(timer);
    worker.terminate().catch(() => {});
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/process') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const form = formidable({ multiples: false, maxFiles: 1, maxFileSize: 10 * 1024 * 1024 });

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, f, fl) => {
        if (err) reject(err);
        else resolve([f, fl]);
      });
    });

    const fileEntry = files.file || files.documentFile || Object.values(files)[0];
    if (!fileEntry) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No file provided' }));
      return;
    }

    const buffer = require('fs').readFileSync(fileEntry.filepath || fileEntry.path);
    const text = await extractText(buffer);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text }));
  } catch (err) {
    console.error('OCR worker error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'OCR processing failed' }));
  }
});

server.listen(PORT, () => {
  console.log(`OCR worker listening on http://localhost:${PORT}`);
});
