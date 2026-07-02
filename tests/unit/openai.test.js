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

  function mockFetch(responses) {
    let callCount = 0;
    global.fetch = mock.fn(() => {
      const r = responses[callCount] || responses[responses.length - 1];
      callCount++;
      return Promise.resolve(r);
    });
  }

  function okResponse(data) {
    return { ok: true, json: () => Promise.resolve(data) };
  }

  function failResponse(status, data) {
    return { ok: false, status, json: () => Promise.resolve(data) };
  }

  describe('generateExplanation', () => {
    it('should return explanation on successful API call', async () => {
      mockFetch([
        okResponse({}), // checkOpenAIAvailable
        okResponse({ // actual chat completion
          choices: [{ message: { content: '  Test explanation  ' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      ]);

      const result = await openai.generateExplanation('Test text');

      assert.ok(result.explanation);
      assert.strictEqual(result.explanation, 'Test explanation');
      assert.strictEqual(result.model, 'gpt-4o-mini');
      assert.ok(result.usage);
      assert.strictEqual(result.usage.prompt_tokens, 10);
    });

    it('should throw on API error', async () => {
      mockFetch([
        okResponse({}), // checkOpenAIAvailable
        failResponse(500, { error: { message: 'Server error' } }), // actual API
      ]);

      await assert.rejects(
        () => openai.generateExplanation('Test'),
        /Server error/
      );
    });

    it('should throw when check fails', async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve(failResponse(401, { error: { message: 'Incorrect API key provided', code: 'invalid_api_key' } }))
      );

      await assert.rejects(
        () => openai.generateExplanation('Test'),
        /Incorrect API key/
      );
    });

    it('should throw on timeout (AbortError) from check', async () => {
      global.fetch = mock.fn(() => {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        return Promise.reject(err);
      });

      await assert.rejects(
        () => openai.generateExplanation('Test'),
        /nie odpowiada/
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

    it('should propagate API key error with code (check passes, API fails)', async () => {
      mockFetch([
        okResponse({}), // checkOpenAIAvailable
        failResponse(401, { error: { message: 'Incorrect API key provided', code: 'invalid_api_key' } }),
      ]);

      try {
        await openai.generateExplanation('Test');
        assert.fail('Should have thrown');
      } catch (err) {
        assert.ok(err.message.includes('Incorrect API key'));
        assert.strictEqual(err.status, 401);
      }
    });

    it('should detect org unverified error (check passes, API fails)', async () => {
      mockFetch([
        okResponse({}), // checkOpenAIAvailable
        failResponse(403, {
          error: {
            message: 'You must be verified for this organization',
            code: 'organization_not_verified',
          },
        }),
      ]);

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
      mockFetch([
        okResponse({}), // checkOpenAIAvailable
        okResponse({ // actual chat completion
          choices: [{ message: { content: 'Explanation' } }],
          usage: { prompt_tokens: 5, completion_tokens: 10 },
        }),
      ]);

      await openai.generateExplanation('Test');
      const usage = openai.getLastUsage();
      assert.ok(usage);
      assert.strictEqual(usage.prompt_tokens, 5);
    });
  });
});
