const { getPaymentSession, updatePaymentSession } = require('./paymentsStore');
const { generateExplanation } = require('./openai');

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    const { paymentId } = req.body || {};
    if (typeof paymentId !== 'string' || !paymentId.trim()) {
      return res.status(400).json({ error: 'Brak paymentId w żądaniu.' });
    }

    const payment = getPaymentSession(paymentId.trim());
    if (!payment) {
      return res.status(404).json({ error: 'Nie znaleziono płatności.' });
    }

    if (payment.status === 'paid') {
      return res.status(200).json({ ok: true, message: 'Płatność już została potwierdzona.', paymentId: payment.id, explanation: payment.explanation });
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
      return res.status(500).json({ error: error.message || 'Błąd generowania wyjaśnienia.' });
    }
  }

  res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
};
