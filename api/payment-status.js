const { getPaymentSession } = require('./paymentsStore');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  const paymentId = req.query?.paymentId;
  if (typeof paymentId !== 'string' || !paymentId.trim()) {
    return res.status(400).json({ error: 'Brak paymentId w zapytaniu.' });
  }

  const payment = getPaymentSession(paymentId.trim());
  if (!payment) {
    return res.status(404).json({ error: 'Nie znaleziono płatności.' });
  }

  return res.status(200).json({
    paymentId: payment.id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    explanation: payment.explanation || null
  });
};
