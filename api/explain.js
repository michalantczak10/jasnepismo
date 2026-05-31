const openai = require('./openai');
const featureFlags = require('../lib/feature-flags');
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

let redisClient = null;
let usingRedis = false;
if (process.env.REDIS_URL) {
  try {
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL);
    redisClient.on('error', (err) => console.warn('Redis error:', err && err.message));
    usingRedis = true;
    console.log('Rate limiting: using Redis at REDIS_URL');
  } catch (err) {
    console.warn(
      'ioredis not available or failed to initialize, falling back to in-memory rate limiter'
    );
    usingRedis = false;
  }
}

// In-memory fallback
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

async function checkRateLimit(clientKey) {
  if (!clientKey) return { ok: true };
  if (usingRedis && redisClient) {
    try {
      const key = `rate:explain:${clientKey}`;
      const ttlSeconds = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
      const count = await redisClient.incr(key);
      if (count === 1) await redisClient.expire(key, ttlSeconds);
      if (count > RATE_LIMIT_MAX) {
        return { ok: false, retryAfter: ttlSeconds };
      }
      return { ok: true };
    } catch (err) {
      console.warn('Redis rate limit check failed, falling back to in-memory:', err && err.message);
      // fallthrough to in-memory
    }
  }

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateMap.get(clientKey) || []).filter((ts) => ts > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) };
  }
  timestamps.push(now);
  rateMap.set(clientKey, timestamps);
  return { ok: true };
}

module.exports = async function handler(req, res) {
  if (!featureFlags.isEnabled('explain')) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(503).json({ error: "Funkcja /api/explain jest tymczasowo wyłączona na tym serwerze." });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
  }

  // rate limiting
  const clientKey = getClientKey(req);
  const rl = await checkRateLimit(clientKey);
  if (!rl.ok) {
    res.setHeader('Retry-After', Math.ceil(rl.retryAfter || RATE_LIMIT_WINDOW_MS / 1000));
    return res.status(429).json({ error: 'Za dużo żądań. Spróbuj ponownie później.' });
  }

  const { text } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Proszę wkleić treść pisma do przetworzenia.' });
  }

  if (text.length > 5000) {
    return res
      .status(413)
      .json({ error: `Tekst przekracza maksymalną dozwoloną długość ${5000} znaków.` });
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
