"use strict";

// Protected endpoint that returns daily costs from OpenAI organization endpoint.
// Requires ADMIN_API_TOKEN (in header x-admin-token or Authorization: Bearer <token>)

module.exports = async function handler(req, res) {
  const method = (req && req.method) ? req.method.toUpperCase() : 'GET';
  if (method !== 'GET') {
    res.setHeader && res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    return res.status(501).json({ error: 'Endpoint nie jest skonfigurowany. Brakuje ADMIN_API_TOKEN.' });
  }

  const headerToken = (req.headers && (req.headers['x-admin-token'] || req.headers['authorization'])) || '';
  let token = headerToken;
  if (typeof token === 'string' && token.toLowerCase().startsWith('bearer ')) token = token.slice(7);

  if (token !== adminToken) {
    return res.status(403).json({ error: 'Brak dostępu.' });
  }

  // determine date (YYYY-MM-DD)
  let dateStr = null;
  if (req.query && req.query.date) dateStr = req.query.date;
  else if (req.url) {
    try {
      const u = new URL(req.url, 'http://localhost');
      dateStr = u.searchParams.get('date');
    } catch (e) {
      // ignore
    }
  }
  if (!dateStr) dateStr = new Date().toISOString().slice(0, 10);

  const ADMIN_KEY = process.env.OPENAI_ADMIN_KEY || process.env.OPENAI_API_KEY;
  if (!ADMIN_KEY) return res.status(501).json({ error: 'Brakuje OPENAI_ADMIN_KEY.' });

  try {
    const resp = await fetch(`https://api.openai.com/v1/organization/costs?date=${encodeURIComponent(dateStr)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${ADMIN_KEY}` },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => null);
      return res.status(resp.status).json({ error: text || 'Błąd pobierania kosztów z OpenAI.' });
    }

    const data = await resp.json().catch(() => null);
    return res.status(200).json({ date: dateStr, costs: data });
  } catch (e) {
    console.error('Error fetching costs:', e);
    return res.status(500).json({ error: 'Błąd podczas pobierania kosztów.' });
  }
};
