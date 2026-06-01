const OPENAI_ADMIN_KEY = process.env.OPENAI_ADMIN_KEY || process.env.OPENAI_API_KEY;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
const crypto = require('crypto');

function safeCompareToken(provided, expected) {
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(String(provided));
    const b = Buffer.from(String(expected));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return false;
  }
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDayRange(dateInput) {
  const day = dateInput ? new Date(String(dateInput)) : new Date();
  if (Number.isNaN(day.getTime())) {
    return null;
  }

  const start = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()) / 1000;
  const end = start + 24 * 60 * 60;

  return { start, end, date: day.toISOString().slice(0, 10) };
}

module.exports = async function handler(req, res) {
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
  if (!safeCompareToken(provided, ADMIN_API_TOKEN)) {
    return res.status(401).json({
      error:
        'Unauthorized. Provide valid admin token in X-Admin-Token header or Authorization: Bearer <token>.',
    });
  }

  if (!OPENAI_ADMIN_KEY) {
    return res.status(500).json({ error: 'Brak klucza OpenAI admin API na serwerze.' });
  }

  const requestedDate = req.query?.date || getTodayDate();
  const dayRange = getDayRange(requestedDate);
  if (!dayRange) {
    return res.status(400).json({ error: 'Nieprawidłowy format daty. Użyj YYYY-MM-DD.' });
  }

  const usageUrl =
    `https://api.openai.com/v1/organization/costs` +
    `?start_time=${dayRange.start}` +
    `&end_time=${dayRange.end}` +
    `&bucket_width=1d&limit=1`;

  try {
    const usageResp = await fetch(usageUrl, {
      headers: {
        Authorization: `Bearer ${OPENAI_ADMIN_KEY}`,
      },
    });

    const usageData = await usageResp.json();
    if (!usageResp.ok) {
      return res.status(usageResp.status).json({ error: usageData.error || usageData });
    }

    return res.status(200).json({
      status: 'ok',
      date: dayRange.date,
      costs: usageData,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Błąd serwera.' });
  }
};
