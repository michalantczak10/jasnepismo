module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  const uptimeSeconds = Math.floor(process.uptime());
  const response = {
    status: 'ok',
    service: 'jasnepismo',
    environment: process.env.VERCEL ? 'vercel' : 'local',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    timestamp: new Date().toISOString(),
    uptime_seconds: uptimeSeconds,
  };

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(response);
};
