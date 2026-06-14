const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const usage = require('../api/usage.js');
const openai = require('../api/openai.js');

function createResponse() {
  let statusCode;
  const headers = {};
  let body;

  return {
    setHeader(key, value) { headers[key] = value; },
    status(code) { statusCode = code; return this; },
    json(data) { body = data; return this; },
    getStatus() { return statusCode; },
    getHeaders() { return headers; },
    getBody() { return body; },
  };
}

describe('api/usage.js', () => {
  const originalGetLastUsage = openai.getLastUsage;

  beforeEach(() => {});

  afterEach(() => {
    openai.getLastUsage = originalGetLastUsage;
  });

  it('returns 405 for non-GET methods', () => {
    const req = { method: 'POST' };
    const res = createResponse();

    usage(req, res);

    assert.equal(res.getStatus(), 405);
    assert.equal(res.getHeaders().Allow, 'GET');
    assert.deepEqual(res.getBody(), { error: 'Metoda niedozwolona. Użyj GET.' });
  });

  it('returns last_usage when available', () => {
    openai.getLastUsage = () => ({ prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 });

    const req = { method: 'GET' };
    const res = createResponse();

    usage(req, res);

    assert.equal(res.getStatus(), 200);
    assert.deepEqual(res.getBody(), { last_usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 } });
  });
});
