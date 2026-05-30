const http = require('http');
const https = require('https');

const targetUrl = process.env.TARGET_URL || 'https://jasnepismo.pl';

// Follow redirects (3xx) up to MAX_REDIRECTS to be resilient to domain-level
// redirects. Returns parsed JSON for successful 2xx responses.
function fetchJsonUrl(urlStr, redirects = 0) {
  const MAX_REDIRECTS = 5;
  return new Promise((resolve, reject) => {
    if (redirects > MAX_REDIRECTS) {
      return reject(new Error(`Too many redirects for ${urlStr}`));
    }

    let url;
    try {
      url = new URL(urlStr);
    } catch (err) {
      return reject(new Error(`Invalid URL: ${urlStr}`));
    }

    const lib = url.protocol === 'https:' ? https : http;
    const headers = { 'User-Agent': 'JasnePismo-Monitor/1.0' };
    if (process.env.MONITOR_ADMIN_TOKEN) {
      headers['X-Admin-Token'] = process.env.MONITOR_ADMIN_TOKEN;
    }

    const req = lib.get(url, { headers }, (res) => {
      // Handle redirects by following Location header
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const location = res.headers.location;
        // Drain response to free socket
        res.resume();
        const nextUrl = new URL(location, url).toString();
        return resolve(fetchJsonUrl(nextUrl, redirects + 1));
      }

      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode} for ${urlStr}: ${body}`));
        }
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (error) {
          reject(new Error(`Invalid JSON from ${urlStr}: ${error.message}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
  });
}

function fetchJson(path) {
  return fetchJsonUrl(`${targetUrl}${path}`);
}

(async () => {
  try {
    console.log(`Checking ${targetUrl}/api/health ...`);
    const health = await fetchJson('/api/health');
    if (health.status !== 'ok') {
      throw new Error(`Health status not ok: ${JSON.stringify(health)}`);
    }
    if (typeof health.uptime_seconds !== 'number') {
      throw new Error(`Health uptime_seconds is not a number: ${JSON.stringify(health)}`);
    }
    console.log('Health check passed.');
    console.log(`Environment: ${health.environment}`);
    console.log(`Model: ${health.model}`);
    console.log(`Last usage: ${JSON.stringify(health.last_usage ?? 'none')}`);

    console.log(`Checking ${targetUrl}/api/usage ...`);
    const usage = await fetchJson('/api/usage');
    if (usage.status !== 'ok') {
      throw new Error(`Usage status not ok: ${JSON.stringify(usage)}`);
    }
    console.log('Usage check passed.');
    console.log(`Usage data: ${JSON.stringify(usage.last_usage ?? 'none')}`);

    process.exit(0);
  } catch (error) {
    console.error('Monitoring check failed:', error.message);
    process.exit(1);
  }
})();
