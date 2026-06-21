const { Worker } = require('bullmq');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REDIS_URL = process.env.REDIS_URL || null;
if (!REDIS_URL) {
  console.error('REDIS_URL required for worker');
  process.exit(1);
}

const redis = new Redis(REDIS_URL);

const worker = new Worker('ocr', async (job) => {
  const payload = job.data;
  const id = payload.id || job.id;
  try {
    // Simple flow: save buffer to tmp file and call extractTextFromFile logic by requiring module
    const buf = payload.file && payload.file.buffer;
    const name = payload.file && payload.file.name;
    if (!buf) throw new Error('No buffer');
    const tmp = path.join(os.tmpdir(), `ocr-${id}`);
    fs.writeFileSync(tmp, Buffer.from(buf));
    // reuse extractTextFromFile by building a minimal file object
    const { extractTextFromFile } = require('../api/extract-utils');
    const fileObj = { filepath: tmp, originalFilename: name };
    const text = await extractTextFromFile(fileObj);
    const key = `ocr:result:${id}`;
    await redis.set(key, JSON.stringify({ text }), 'EX', 60 * 60); // 1h TTL
    try { fs.unlinkSync(tmp); } catch (e) {}
    return { id, text };
  } catch (e) {
    console.error('Worker job error (safe):', e && e.message ? e.message : e);
    const key = `ocr:result:${id}`;
    await redis.set(key, JSON.stringify({ error: String(e) }), 'EX', 60 * 5);
    return { id, error: String(e) };
  }
});

worker.on('completed', (job) => {
  console.log('Job completed', job.id);
});
worker.on('failed', (job, err) => {
  console.error('Job failed', job.id, err && err.message ? err.message : err);
});

console.log('OCR worker started');
