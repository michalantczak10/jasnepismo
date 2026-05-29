const openai = require('./openai');

const MAX_TEXT_LENGTH = 5000;

// Simple in-memory rate limiter (per IP). Skips limiting when client can't be identified
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window
const rateMap = new Map(); // clientKey => [timestamps]

function getClientKey(req) {
  if (req && req.headers) {
    const fwd = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
    if (fwd) return String(fwd).split(',')[0].trim();
  }
  if (req && req.connection && req.connection.remoteAddress) return req.connection.remoteAddress;
  if (req && req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
  }

  // rate limiting
  const clientKey = getClientKey(req);
  if (clientKey) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const timestamps = (rateMap.get(clientKey) || []).filter((ts) => ts > windowStart);
    if (timestamps.length >= RATE_LIMIT_MAX) {
      res.setHeader('Retry-After', Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
      return res.status(429).json({ error: 'Za dużo żądań. Spróbuj ponownie później.' });
    }
    timestamps.push(now);
    rateMap.set(clientKey, timestamps);
  }

  const { text } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Proszę wkleić treść pisma do przetworzenia.' });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return res
      .status(413)
      .json({ error: `Tekst przekracza maksymalną dozwoloną długość ${MAX_TEXT_LENGTH} znaków.` });
  }

  try {
    const { explanation, usage } = await openai.generateExplanation(text.trim());
    return res.status(200).json({ explanation, usage });
  } catch (error) {
    // Log full error on the server for debugging, but return a generic message to the client
    console.error('Error in /api/explain:', error);
    return res.status(500).json({ error: 'Wystąpił błąd serwera. Spróbuj ponownie później.' });
  }
};
