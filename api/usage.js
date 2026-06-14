"use strict";

const openai = require('./openai');

module.exports = function handler(req, res) {
  const method = (req && req.method) ? req.method.toUpperCase() : 'GET';
  if (method !== 'GET') {
    res.setHeader && res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  try {
    const lastUsage = (openai && typeof openai.getLastUsage === 'function') ? openai.getLastUsage() : null;
    return res.status(200).json({ last_usage: lastUsage || null });
  } catch (e) {
    console.error('Usage handler error', e);
    return res.status(500).json({ error: 'Błąd serwera.' });
  }
};
