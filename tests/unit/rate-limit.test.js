const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');

// Force in-memory mode (no Redis)
delete process.env.REDIS_URL;
delete process.env.UPSTASH_REDIS_REST_URL;

describe('rate-limit.js', () => {
  let rateLimit;

  before(() => {
    rateLimit = require('../../api/rate-limit');
  });

  describe('checkRateLimit', () => {
    it('should allow request when under limit', async () => {
      const result = await rateLimit.checkRateLimit('test-client-1');
      assert.ok(result.ok);
    });

    it('should allow request with null client key', async () => {
      const result = await rateLimit.checkRateLimit(null);
      assert.ok(result.ok);
    });

    it('should allow request with undefined client key', async () => {
      const result = await rateLimit.checkRateLimit(undefined);
      assert.ok(result.ok);
    });

    it('should block after exceeding limit', async () => {
      const clientKey = 'test-client-exceed';

      // Consume all 10 allowed requests
      for (let i = 0; i < 10; i++) {
        const result = await rateLimit.checkRateLimit(clientKey);
        assert.ok(result.ok, `Request ${i + 1} should be allowed`);
      }

      // 11th request should be blocked
      const blocked = await rateLimit.checkRateLimit(clientKey);
      assert.ok(!blocked.ok);
      assert.ok(blocked.retryAfter > 0);
    });

    it('should use separate buckets for different clients', async () => {
      for (let i = 0; i < 10; i++) {
        const result = await rateLimit.checkRateLimit('client-a');
        assert.ok(result.ok);
      }

      // client-b should still be allowed
      const result = await rateLimit.checkRateLimit('client-b');
      assert.ok(result.ok);
    });
  });
});
