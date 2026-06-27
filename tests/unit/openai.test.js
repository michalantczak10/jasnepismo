const { describe, it, mock, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'sk-test-key';
process.env.OPENAI_MODEL = 'gpt-4o-mini';
process.env.OPENAI_FALLBACK_MODEL = 'gpt-4o-mini';

describe('openai.js', () => {
  let openai;
  let originalFetch;

  before(() => {
    originalFetch = global.fetch;
    openai = require('../../api/openai');
  });

  after(() => {
    global.fetch = originalFetch;
  });

  describe('generateExplanation', () => {
    it('should return explanation on successful API call', async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: '  Test explanation  ' } }],
              usage: { prompt_tokens: 10, completion_tokens: 20 },
            }),
        })
      );

      const result = await openai.generateExplanation('Test text');

      assert.ok(result.explanation);
      assert.strictEqual(result.explanation, 'Test explanation');
      assert.strictEqual(result.model, 'gpt-4o-mini');
      assert.ok(result.usage);
      assert.strictEqual(result.usage.prompt_tokens, 10);
    });

    it('should throw on API error', async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: { message: 'Server error' } }),
        })
      );

      await assert.rejects(
        () => openai.generateExplanation('Test'),
        /Server error/
      );
    });

    it('should throw on timeout (AbortError)', async () => {
      global.fetch = mock.fn(() => {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        return Promise.reject(err);
      });

      await assert.rejects(
        () => openai.generateExplanation('Test'),
        /wygasło/
      );
    });

    it('should throw on empty text', async () => {
      await assert.rejects(
        () => openai.generateExplanation(''),
        /Brak treści/
      );
    });

    it('should throw on whitespace-only text', async () => {
      await assert.rejects(
        () => openai.generateExplanation('   '),
        /Brak treści/
      );
    });

    it('should propagate API key error with code', async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () =>
            Promise.resolve({ error: { message: 'Incorrect API key provided', code: 'invalid_api_key' } }),
        })
      );

      try {
        await openai.generateExplanation('Test');
        assert.fail('Should have thrown');
      } catch (err) {
        assert.ok(err.message.includes('Incorrect API key'));
        assert.strictEqual(err.status, 401);
      }
    });

    it('should detect org unverified error', async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: () =>
            Promise.resolve({
              error: {
                message: 'You must be verified for this organization',
                code: 'organization_not_verified',
              },
            }),
        })
      );

      try {
        await openai.generateExplanation('Test');
        assert.fail('Should have thrown');
      } catch (err) {
        assert.strictEqual(err.code, 'ORG_UNVERIFIED');
      }
    });
  });

  describe('getLastUsage', () => {
    it('should return last usage after successful call', async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: 'Explanation' } }],
              usage: { prompt_tokens: 5, completion_tokens: 10 },
            }),
        })
      );

      await openai.generateExplanation('Test');
      const usage = openai.getLastUsage();
      assert.ok(usage);
      assert.strictEqual(usage.prompt_tokens, 5);
    });
  });
});
