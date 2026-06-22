const Redis = require('ioredis');

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

let redisClient = null;
let inMemoryRateMap = new Map(); // Fallback in-memory rate limiting

async function initRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  if (!redisUrl) {
    console.warn('Redis URL not configured - rate limiting will use in-memory fallback');
    return null;
  }

  try {
    if (redisUrl.includes('upstash')) {
      const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
      redisClient = new Redis(redisUrl, {
        password: token,
        retryStrategy: (times) => Math.min(times * 100, 3000),
      });
    } else {
      redisClient = new Redis(redisUrl, {
        retryStrategy: (times) => Math.min(times * 100, 3000),
      });
    }

    await redisClient.ping();
    console.log('Redis client initialized successfully');
    return redisClient;
  } catch (error) {
    console.warn('Failed to initialize Redis client:', error.message);
    redisClient = null;
    return null;
  }
}

async function checkRateLimit(clientKey) {
  if (!clientKey) return { ok: true };

  const redis = await initRedisClient();
  if (redis) {
    const now = Date.now();
    const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS);
    const bucket = `rl:${clientKey}:${windowStart}`;

    try {
      const count = await redis.incr(bucket);
      if (count === 1) {
        await redis.expire(bucket, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
      }

      if (count > RATE_LIMIT_MAX) {
        const ttl = await redis.ttl(bucket);
        return {
          ok: false,
          retryAfter: ttl > 0 ? ttl : Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
          source: 'redis',
        };
      }

      return { ok: true, source: 'redis' };
    } catch (error) {
      console.warn('Redis rate limiting error:', error.message);
      // Fall through to in-memory fallback
    }
  }

  // In-memory fallback
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (inMemoryRateMap.get(clientKey) || []).filter((ts) => ts > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000), source: 'memory' };
  }

  timestamps.push(now);
  inMemoryRateMap.set(clientKey, timestamps);
  return { ok: true, source: 'memory' };
}

module.exports = { checkRateLimit, initRedisClient };
