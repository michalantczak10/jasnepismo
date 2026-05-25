const { createPaymentSession } = require('./paymentsStore');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
  }

  const { text } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Proszę wkleić treść pisma do przetworzenia.' });
  }

  const payment = createPaymentSession(text.trim());
  const provider = process.env.PAYMENT_PROVIDER || 'demo';

  if (provider !== 'demo') {
    return res.status(501).json({
      error: 'Integracja płatności nie została jeszcze skonfigurowana. Ustaw PAYMENT_PROVIDER i odpowiednie dane w env.'
    });
  }

  const paymentUrl = `/mock-payment.html?paymentId=${encodeURIComponent(payment.id)}`;

  return res.status(200).json({
    paymentId: payment.id,
    paymentUrl,
    amount: payment.amount,
    currency: payment.currency,
    provider: 'demo'
  });
};
