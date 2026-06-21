const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

module.exports = async function handler(req, res) {
  const method = req && req.method ? req.method.toUpperCase() : 'GET';
  if (method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  const id = (req.query && req.query.id) || (req && req.headers && req.headers['x-job-id']);
  if (!id) return res.status(400).json({ error: 'Brak id param' });

  try {
    const key = `ocr:result:${id}`;
    const data = await redis.get(key);
    if (!data) return res.status(404).json({ status: 'pending' });
    return res.status(200).json({ status: 'done', result: JSON.parse(data) });
  } catch (e) {
    console.error('ocr result error:', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
};
