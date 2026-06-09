module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    return res.status(500).json({ error: 'Admin token is not configured on the server.' });
  }

  const auth = req.headers && (req.headers.authorization || req.headers['x-admin-token']);
  if (!auth) return res.status(401).json({ error: 'Brak nagłówka autoryzacji.' });

  // support both 'Bearer <token>' and raw X-Admin-Token
  let token = auth;
  if (typeof token === 'string' && token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7).trim();
  }

  if (token !== adminToken) return res.status(403).json({ error: 'Nieautoryzowany dostęp.' });

  try {
    const openai = require('./openai');
    const cache = typeof openai.getCacheStats === 'function' ? openai.getCacheStats() : null;
    const lastUsage = typeof openai.getLastUsage === 'function' ? openai.getLastUsage() : null;
    return res.status(200).json({ cache, lastUsage });
  } catch (e) {
    console.error('Error in /api/cache-status:', e);
    return res.status(500).json({ error: 'Błąd serwera.' });
  }
};
