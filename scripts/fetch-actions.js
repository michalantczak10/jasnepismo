#!/usr/bin/env node
// fetch-actions.js
// Usage: node scripts/fetch-actions.js <GITHUB_PAT>
// Fetch recent workflow runs and attempt to download artifacts and logs for failed runs.

const https = require('https');
const fs = require('fs');
const path = require('path');

function readRepoFromGitConfig() {
  const cfg = fs.readFileSync(path.resolve(__dirname, '..', '.git', 'config'), 'utf8');
  const m = cfg.match(/url = https:\/\/github.com\/(.+?)\/(.+?)\.git/);
  if (!m) throw new Error('Could not parse owner/repo from .git/config');
  return `${m[1]}/${m[2]}`;
}

function httpGetJson(url, token) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const headers = {
      'User-Agent': 'node-fetch-actions-script',
      Accept: 'application/vnd.github+json',
      Authorization: `token ${token}`,
    };
    const req = https.request({ ...opts, method: 'GET', headers }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function httpGetFollow(url, token, outPath) {
  return new Promise((resolve, reject) => {
    function _get(u, redirectsRemaining) {
      if (redirectsRemaining < 0) return reject(new Error('Too many redirects'));
      const opts = new URL(u);
      const headers = {
        'User-Agent': 'node-fetch-actions-script',
        Accept: 'application/vnd.github+json',
        Authorization: `token ${token}`,
      };
      const req = https.request({ ...opts, method: 'GET', headers }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // follow
          return _get(res.headers.location, redirectsRemaining - 1);
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const fileStream = fs.createWriteStream(outPath);
          res.pipe(fileStream);
          fileStream.on('finish', () => fileStream.close(resolve));
          fileStream.on('error', reject);
        } else {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (c) => (data += c));
          res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${data}`)));
        }
      });
      req.on('error', reject);
      req.end();
    }
    _get(url, 10);
  });
}

(async function main() {
  try {
    const token = process.argv[2] || process.env.GITHUB_PAT;
    if (!token) {
      console.error('Provide GitHub PAT as first argument or GITHUB_PAT env var');
      process.exit(1);
    }
    const repo = readRepoFromGitConfig();
    console.log('Repo:', repo);
    const apiBase = `https://api.github.com/repos/${repo}`;

    console.log('Listing workflow runs...');
    const runs = await httpGetJson(`${apiBase}/actions/runs?per_page=50`, token);
    fs.writeFileSync('runs.json', JSON.stringify(runs, null, 2), 'utf8');
    console.log('Saved runs.json');

    const runsArr = runs.workflow_runs || [];
    for (const run of runsArr) {
      const id = run.id;
      console.log(
        `Run ${id} status=${run.status} conclusion=${run.conclusion} created_at=${run.created_at}`
      );
      // Save run detail
      try {
        const detail = await httpGetJson(`${apiBase}/actions/runs/${id}`, token);
        fs.writeFileSync(`run-${id}.json`, JSON.stringify(detail, null, 2));
      } catch (err) {
        console.error(`Failed to get run detail for ${id}:`, err.message || err);
      }

      // Try artifacts
      try {
        const arts = await httpGetJson(`${apiBase}/actions/runs/${id}/artifacts`, token);
        fs.writeFileSync(`artifacts-run-${id}.json`, JSON.stringify(arts, null, 2));
        if (arts && arts.total_count && arts.artifacts && arts.artifacts.length) {
          for (const a of arts.artifacts) {
            const out = path.resolve(`artifact-${id}-${a.id}.zip`);
            console.log(`Downloading artifact ${a.id} -> ${out}`);
            try {
              await httpGetFollow(a.archive_download_url, token, out);
              console.log('Downloaded', out);
            } catch (err) {
              console.error('Artifact download failed:', err && err.message ? err.message : err);
            }
          }
        }
      } catch (err) {
        console.error(
          `Failed to list artifacts for run ${id}:`,
          err && err.message ? err.message : err
        );
      }

      // Try logs.zip
      try {
        const outLogs = path.resolve(`run-${id}-logs.zip`);
        console.log(`Attempting to download logs for run ${id} -> ${outLogs}`);
        await httpGetFollow(`${apiBase}/actions/runs/${id}/logs`, token, outLogs);
        console.log('Downloaded logs for run', id);
      } catch (err) {
        console.error(
          `Failed to download logs for run ${id}:`,
          err && err.message ? err.message : err
        );
      }
    }

    console.log('Done');
  } catch (err) {
    console.error('Error in fetch-actions:', err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();
