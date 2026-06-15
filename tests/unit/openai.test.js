const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const openai = require('../../api/openai.js');

describe('api/openai.js', () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_MODEL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = '';
    process.env.OPENAI_MODEL = 'gpt-4.1-mini';
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
    process.env.OPENAI_MODEL = originalModel;
    global.fetch = originalFetch;
  });

  it('throws when OPENAI_API_KEY is missing', async () => {
    await assert.rejects(openai.generateExplanation('Test'), {
      message: 'Brak klucza OpenAI API na serwerze.',
    });
  });

  it('returns explanation and usage when OpenAI responds successfully', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Wyjaśnienie testowe.' } }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
    });

    const result = await openai.generateExplanation('Przykładowy tekst');
    assert.equal(result.explanation, 'Wyjaśnienie testowe.');
    // Single-call pipeline now returns usage from the single request
    assert.deepEqual(result.usage, { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 });
  });
});

