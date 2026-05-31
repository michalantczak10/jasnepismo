#!/usr/bin/env node
// Usage: node scripts/trigger-workflow.js <workflow_file> <GITHUB_PAT> [ref]
const https = require('https');
const path = require('path');

const workflowFile = process.argv[2];
const token = process.argv[3] || process.env.GITHUB_PAT;
const ref = process.argv[4] || 'main';
if (!workflowFile || !token) {
  console.error('Usage: node scripts/trigger-workflow.js <workflow_file> <GITHUB_PAT> [ref]');
  process.exit(2);
}

const repo = (() => {
  // Read .git/config
  try {
    const cfg = require('fs').readFileSync(path.resolve(__dirname, '..', '.git', 'config'), 'utf8');
    const m = cfg.match(/url = https:\/\/github.com\/(.+?)\/(.+?)\.git/);
    if (!m) return null;
    return `${m[1]}/${m[2]}`;
  } catch (e) {
    return null;
  }
})();
if (!repo) {
  console.error('Could not determine repo from .git/config');
  process.exit(2);
}

const payload = JSON.stringify({ ref });
const opts = new URL(
  `https://api.github.com/repos/${repo}/actions/workflows/${encodeURIComponent(workflowFile)}/dispatches`
);
const headers = {
  'User-Agent': 'node-trigger-workflow',
  Accept: 'application/vnd.github+json',
  Authorization: `token ${token}`,
  'Content-Type': 'application/json',
  'Content-Length': Buffer.byteLength(payload),
};

const req = https.request({ ...opts, method: 'POST', headers }, (res) => {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', (c) => (data += c));
  res.on('end', () => {
    console.log('status', res.statusCode);
    if (data) console.log('body', data);
    if (res.statusCode >= 200 && res.statusCode < 300) process.exit(0);
    else process.exit(3);
  });
});
req.on('error', (e) => {
  console.error('request error', e && e.message ? e.message : e);
  process.exit(4);
});
req.write(payload);
req.end();
