const { getPaymentSession, updatePaymentSession } = require('./paymentsStore');
const { generateExplanation } = require('./openai');

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'demo-webhook-secret';

function verifySecret(req) {
  const headerSecret = req.headers['x-webhook-secret'];
  const bodySecret = req.body?.secret;
  return headerSecret === WEBHOOK_SECRET || bodySecret === WEBHOOK_SECRET;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
  }

  if (!verifySecret(req)) {
    return res.status(401).json({ error: 'Nieprawidłowy sekret webhooka.' });
  }

  const { paymentId, status } = req.body || {};
  if (typeof paymentId !== 'string' || !paymentId.trim() || typeof status !== 'string' || !status.trim()) {
    return res.status(400).json({ error: 'Brak paymentId lub statusu w żądaniu.' });
  }

  const payment = getPaymentSession(paymentId.trim());
  if (!payment) {
    return res.status(404).json({ error: 'Nie znaleziono płatności.' });
  }

  if (status !== 'paid') {
    updatePaymentSession(payment.id, { status: 'failed' });
    return res.status(200).json({ ok: true, status: 'failed' });
  }

  if (payment.status === 'paid') {
    return res.status(200).json({ ok: true, message: 'Płatność została już potwierdzona.' });
  }

  try {
    const explanation = await generateExplanation(payment.text);
    updatePaymentSession(payment.id, {
      status: 'paid',
      explanation,
      paidAt: new Date().toISOString()
    });

    return res.status(200).json({ ok: true, paymentId: payment.id, explanation });
  } catch (error) {
    updatePaymentSession(payment.id, { status: 'failed' });
    return res.status(500).json({ error: error.message || 'Błąd generowania wyjaśnienia po płatności.' });
  }
};
