const { parseForm } = require('./extract-utils');
const { Queue } = require('bullmq');
const { v4: uuidv4 } = require('uuid');

const REDIS_URL = process.env.REDIS_URL || null;
if (!REDIS_URL) throw new Error('REDIS_URL required for OCR queue');

const queue = new Queue('ocr', { connection: { url: REDIS_URL } });

module.exports = async function handler(req, res) {
  if ((req.method || 'POST').toUpperCase() !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
  }

  try {
    const parsed = await parseForm(req);
    const files = parsed.files || {};
    const file = files.documentFile || files.file || Object.values(files)[0];
    if (!file) return res.status(400).json({ error: 'Brak pliku w żądaniu.' });

    const id = uuidv4();
    const job = await queue.add('ocr-job', {
      id,
      file: { buffer: file.buffer || file.data, name: file.originalFilename || file.name },
    });
    return res.status(202).json({ jobId: job.id, id });
  } catch (e) {
    console.error('OCR queue enqueue error:', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'Błąd serwera.' });
  }
};
