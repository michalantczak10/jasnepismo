module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
  }

  const { text } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Proszę wkleić treść pisma do przetworzenia.' });
  }

  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const paymentUrl = `/mock-payment.html?paymentId=${encodeURIComponent(paymentId)}`;

  return res.status(200).json({
    paymentId,
    paymentUrl,
    amount: 100,
    currency: 'PLN',
    provider: 'demo'
  });
};
