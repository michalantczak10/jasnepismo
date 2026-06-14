const assert = require('node:assert/strict');
const { describe, it, afterEach } = require('node:test');
const openai = require('../api/openai.js');
const explain = require('../api/explain.js');

function createResponse() {
  let statusCode;
  const headers = {};
  let body;

  return {
    setHeader(key, value) {
      headers[key] = value;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      body = data;
      return this;
    },
    getStatus() {
      return statusCode;
    },
    getHeaders() {
      return headers;
    },
    getBody() {
      return body;
    },
  };
}

describe('api/explain.js', () => {
  const originalGenerate = openai.generateExplanation;

  afterEach(() => {
    openai.generateExplanation = originalGenerate;
  });

  it('returns 405 for non-POST methods', async () => {
    const req = { method: 'GET' };
    const res = createResponse();

    await explain(req, res);

    assert.equal(res.getStatus(), 405);
    assert.equal(res.getHeaders().Allow, 'POST');
    assert.deepEqual(res.getBody(), { error: 'Metoda niedozwolona. Użyj POST.' });
  });

  it('returns 400 when text is missing', async () => {
    const req = { method: 'POST', body: {} };
    const res = createResponse();

    await explain(req, res);

    assert.equal(res.getStatus(), 400);
    assert.deepEqual(res.getBody(), { error: 'Proszę wkleić treść pisma do przetworzenia.' });
  });

  it('returns 200 and explanation when text is provided', async () => {
    openai.generateExplanation = async () => ({
      explanation: 'Testowe wyjaśnienie',
      usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
    });

    const req = { method: 'POST', body: { text: 'Test' } };
    const res = createResponse();

    await explain(req, res);

    assert.equal(res.getStatus(), 200);
    const body = res.getBody();
    assert.equal(body.explanation, 'Testowe wyjaśnienie');
    assert.deepEqual(body.usage, { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 });
  });

  it('returns 500 when OpenAI helper fails', async () => {
    openai.generateExplanation = async () => {
      throw new Error('boom');
    };

    const req = { method: 'POST', body: { text: 'Test' } };
    const res = createResponse();

    await explain(req, res);

    assert.equal(res.getStatus(), 500);
    assert.deepEqual(res.getBody(), {
      error: 'Wystąpił błąd serwera podczas generowania wyjaśnienia. Spróbuj ponownie później.',
    });
  });
});
