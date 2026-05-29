const https = require('https');

const targetUrl = process.env.TARGET_URL || 'https://www.jasnepismo.pl';

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    const url = `${targetUrl}${path}`;
    const headers = { 'User-Agent': 'JasnePismo-Monitor/1.0' };
    // If a MONITOR_ADMIN_TOKEN is provided to the monitor (e.g., via CI secret),
    // include it as X-Admin-Token so protected admin endpoints can be checked.
    if (process.env.MONITOR_ADMIN_TOKEN) {
      headers['X-Admin-Token'] = process.env.MONITOR_ADMIN_TOKEN;
    }

    https
      .get(url, { headers }, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`HTTP ${res.statusCode} for ${url}: ${body}`));
          }
          try {
            const json = JSON.parse(body);
            resolve(json);
          } catch (error) {
            reject(new Error(`Invalid JSON from ${url}: ${error.message}`));
          }
        });
      })
      .on('error', reject);
  });
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
