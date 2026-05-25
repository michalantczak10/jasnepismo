const { getLastUsage } = require('./openai');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  const usage = getLastUsage();
  return res.status(200).json({
    status: 'ok',
    last_usage: usage,
    note: usage ? 'Dane pochodzą z ostatniego wywołania /api/explain.' : 'Brak danych. Wykonaj najpierw żądanie POST do /api/explain.',
  });
};
