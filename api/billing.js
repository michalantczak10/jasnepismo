const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Brak klucza OpenAI API na serwerze.' });
  }

  const date = req.query?.date || getTodayDate();
  const usageUrl = `https://api.openai.com/v1/usage?date=${date}`;

  try {
    const usageResp = await fetch(usageUrl, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    });

    const usageData = await usageResp.json();
    if (!usageResp.ok) {
      return res.status(usageResp.status).json({ error: usageData.error || usageData });
    }

    return res.status(200).json({
      status: 'ok',
      date,
      usage: usageData,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Błąd serwera.' });
  }
};
