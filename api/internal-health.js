const https = require('https');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  const token = process.env.MONITOR_ADMIN_TOKEN;
  // Expect monitor to provide MONITOR_ADMIN_TOKEN in Authorization or X-Admin-Token
  const auth = req.headers && (req.headers.authorization || req.headers['x-admin-token']);
  if (!token) {
    return res.status(500).json({ status: 'error', error: 'MONITOR_ADMIN_TOKEN not configured on server.' });
  }
  if (!auth) return res.status(401).json({ status: 'error', error: 'Brak nagłówka autoryzacji.' });
  let provided = auth;
  if (typeof provided === 'string' && provided.toLowerCase().startsWith('bearer ')) provided = provided.slice(7).trim();
  if (provided !== token) return res.status(403).json({ status: 'error', error: 'Nieautoryzowany dostęp.' });

  // Basic checks: uptime and OPENAI_API_KEY presence. Optionally try a lightweight request to OpenAI to validate key.
  const uptimeSeconds = Math.floor(process.uptime());
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const response = {
    status: 'ok',
    service: 'jasnepismo',
    timestamp: new Date().toISOString(),
    uptime_seconds: uptimeSeconds,
    openai_api_key_present: hasOpenAIKey,
  };

  // If no key, return error status to alert monitor
  if (!hasOpenAIKey) {
    return res.status(500).json({ status: 'error', error: 'OPENAI_API_KEY not set', details: response });
  }

  // Optionally perform a lightweight reachability check to OpenAI (no tokens consumed).
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const options = {
      method: 'GET',
      hostname: 'api.openai.com',
      path: '/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 5000,
    };

    const ok = await new Promise((resolve) => {
      const req2 = https.request(options, (r) => {
        // treat 200 or 401 as reachable (401 => key invalid but reachable)
        resolve(r.statusCode >= 200 && r.statusCode < 600);
      });
      req2.on('error', () => resolve(false));
      req2.on('timeout', () => { req2.destroy(); resolve(false); });
      req2.end();
    });

    if (!ok) {
      return res.status(500).json({ status: 'error', error: 'Cannot reach OpenAI API', details: response });
    }
  } catch (e) {
    return res.status(500).json({ status: 'error', error: 'OpenAI reachability check failed', details: response });
  }

  return res.status(200).json(response);
};