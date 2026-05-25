const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function getCurrentMonthDates() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return {
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Brak klucza OpenAI API na serwerze.' });
  }

  const { start_date, end_date } = req.query || getCurrentMonthDates();
  const usageUrl = `https://api.openai.com/v1/dashboard/billing/usage?start_date=${start_date}&end_date=${end_date}`;
  const subscriptionUrl = 'https://api.openai.com/v1/dashboard/billing/subscription';

  try {
    const [usageResp, subscriptionResp] = await Promise.all([
      fetch(usageUrl, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }),
      fetch(subscriptionUrl, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }),
    ]);

    const usageData = await usageResp.json();
    const subscriptionData = await subscriptionResp.json();

    if (!usageResp.ok) {
      return res.status(usageResp.status).json({ error: usageData.error || usageData });
    }

    if (!subscriptionResp.ok) {
      return res.status(subscriptionResp.status).json({ error: subscriptionData.error || subscriptionData });
    }

    return res.status(200).json({
      status: 'ok',
      start_date,
      end_date,
      usage: usageData,
      subscription: subscriptionData,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Błąd serwera.' });
  }
};
