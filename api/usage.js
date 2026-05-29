const { getLastUsage } = require('./openai');

const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  if (!ADMIN_API_TOKEN) {
    return res.status(503).json({ error: 'Admin token not configured on server.' });
  }

  const provided =
    (req.headers &&
      (req.headers['x-admin-token'] ||
        (req.headers.authorization && req.headers.authorization.split(' ')[1]))) ||
    '';
  if (!provided || provided !== ADMIN_API_TOKEN) {
    return res
      .status(401)
      .json({
        error:
          'Unauthorized. Provide valid admin token in X-Admin-Token header or Authorization: Bearer <token>.',
      });
  }

  const usage = getLastUsage();
  return res.status(200).json({
    status: 'ok',
    last_usage: usage,
    note: usage
      ? 'Dane pochodzą z ostatniego wywołania /api/explain.'
      : 'Brak danych. Wykonaj najpierw żądanie POST do /api/explain.',
  });
};
