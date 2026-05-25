const { generateExplanation } = require('./openai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
  }

  const { paymentId, text } = req.body || {};
  if (typeof paymentId !== 'string' || !paymentId.trim()) {
    return res.status(400).json({ error: 'Brak paymentId w żądaniu.' });
  }

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Brak treści pisma w żądaniu.' });
  }

  try {
    const explanation = await generateExplanation(text.trim());
    return res.status(200).json({ ok: true, paymentId: paymentId.trim(), explanation });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Błąd generowania wyjaśnienia.' });
  }
};
