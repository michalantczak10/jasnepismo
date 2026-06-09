const fs = require('fs');
const url = require('url');
const http = require('http');
const https = require('https');

const METRICS_URL = process.env.METRICS_URL;
const METRICS_TOKEN = process.env.METRICS_TOKEN;

if (!METRICS_URL) {
  console.error('METRICS_URL not set');
  process.exit(1);
}

const parsed = url.parse(METRICS_URL);
const client = parsed.protocol === 'https:' ? https : http;

const options = {
  hostname: parsed.hostname,
  port: parsed.port,
  path: parsed.path + (parsed.search || ''),
  method: 'GET',
  headers: {},
  timeout: 10000,
};
if (METRICS_TOKEN) {
  options.headers['Authorization'] = `Bearer ${METRICS_TOKEN}`;
}

function fetchOnce(opts, outPath) {
  return new Promise((resolve, reject) => {
    const req = client.request(opts, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error('HTTP status ' + res.statusCode));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        fs.writeFileSync(outPath, body, 'utf8');
        resolve(outPath);
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

(async function main(){
  try{
    const now = new Date();
    const fname = now.toISOString().replace(/[:.]/g,'-') + '.txt';
    const dir = require('path').join(__dirname, '..', 'monitoring', 'snapshots');
    fs.mkdirSync(dir, { recursive: true });
    const outPath = require('path').join(dir, fname);
    await fetchOnce(options, outPath);
    console.log('Saved metrics to', outPath);
    process.exit(0);
  } catch(e) {
    console.error('Fetch failed:', e && e.message ? e.message : e);
    process.exit(2);
  }
})();
