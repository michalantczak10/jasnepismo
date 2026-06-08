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
      const token = process.env.MONITOR_ADMIN_TOKEN;
      // Send both X-Admin-Token (existing server behavior) and Authorization
      // Bearer <token> to support endpoints that expect an Authorization header.
      headers['X-Admin-Token'] = token;
      headers['Authorization'] = token.toLowerCase().startsWith('bearer ')
        ? token
        : `Bearer ${token}`;
    }

    const req = lib.get(url, { headers }, (res) => {
      // Handle redirects by following Location header
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const location = res.headers.location;
        const nextUrl = new URL(location, url).toString();
        // Log redirect path for observability in CI logs
        console.log(`Redirect ${res.statusCode}: ${url.toString()} -> ${nextUrl}`);
        // Drain response to free socket
        res.resume();
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

    // /api/usage endpoint removed — skip usage check
    console.log('Skipping /api/usage check (endpoint removed).');

    process.exit(0);
  } catch (error) {
    console.error('Monitoring check failed:', error.message);
    process.exit(1);
  }
})();
