const assert = require('node:assert/strict');
const { describe, it, afterEach } = require('node:test');
const openai = require('../../api/openai.js');
const explain = require('../../api/explain.js');

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

  it('returns 504 when OpenAI request times out', async () => {
    const err = new Error('OpenAI request timed out. Spróbuj ponownie później.');
    err.code = 'OPENAI_TIMEOUT';
    openai.generateExplanation = async () => {
      throw err;
    };

    const req = { method: 'POST', body: { text: 'Test' } };
    const res = createResponse();

    await explain(req, res);

    assert.equal(res.getStatus(), 504);
    assert.deepEqual(res.getBody(), {
      error: 'Żądanie do OpenAI wygasło. Spróbuj ponownie później.',
    });
  });

  it('returns extractedText without calling OpenAI when X-Extract-Only is set', async () => {
    const extractUtils = require('../../api/extract-utils.js');
    const originalParseForm = extractUtils.parseForm;
    const originalGenerate = openai.generateExplanation;

    extractUtils.parseForm = async () => ({
      fields: {},
      files: {
        file: {
          originalFilename: 'sample.txt',
          mimetype: 'text/plain',
          buffer: Buffer.from('Tekst z pliku'),
        },
      },
    });
    openai.generateExplanation = async () => {
      throw new Error('OpenAI should not be called');
    };

    delete require.cache[require.resolve('../../api/explain.js')];
    const explainWithStub = require('../../api/explain.js');

    const req = {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=---', 'x-extract-only': '1' },
    };
    const res = createResponse();

    await explainWithStub(req, res);

    assert.equal(res.getStatus(), 200);
    assert.equal(res.getBody().extractedText, 'Tekst z pliku');

    extractUtils.parseForm = originalParseForm;
    openai.generateExplanation = originalGenerate;
  });

  it('enforces rate limiting for repeated requests from the same client', async () => {
    const originalGenerate = openai.generateExplanation;
    openai.generateExplanation = async () => ({ explanation: 'ok', usage: {} });

    const req = {
      method: 'POST',
      body: { text: 'Test' },
      headers: { 'x-forwarded-for': '203.0.113.42' },
    };

    for (let i = 0; i < 10; i += 1) {
      const res = createResponse();
      await explain(req, res);
      assert.equal(res.getStatus(), 200, `expected request ${i + 1} to succeed`);
    }

    const lastRes = createResponse();
    await explain(req, lastRes);
    assert.equal(lastRes.getStatus(), 429);
    assert.ok(lastRes.getBody().error.includes('Za dużo żądań'));

    openai.generateExplanation = originalGenerate;
  });
});

