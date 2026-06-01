const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');

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

function loadCosts() {
  delete require.cache[require.resolve('../api/costs.js')];
  return require('../api/costs.js');
}

describe('api/costs.js', () => {
  const originalEnv = {
    ADMIN_API_TOKEN: process.env.ADMIN_API_TOKEN,
    OPENAI_ADMIN_KEY: process.env.OPENAI_ADMIN_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
  const originalFetch = global.fetch;
  let lastFetch;

  beforeEach(() => {
    process.env.ADMIN_API_TOKEN = 'admin-token';
    process.env.OPENAI_ADMIN_KEY = 'openai-admin-key';
    process.env.OPENAI_API_KEY = '';
    lastFetch = null;
    global.fetch = async (url, options) => {
      lastFetch = { url, options };
      return {
        ok: true,
        json: async () => ({
          data: [{ amount: 12.34, line_item: 'completions' }],
          next_page: null,
        }),
      };
    };
  });

  afterEach(() => {
    process.env.ADMIN_API_TOKEN = originalEnv.ADMIN_API_TOKEN;
    process.env.OPENAI_ADMIN_KEY = originalEnv.OPENAI_ADMIN_KEY;
    process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
    global.fetch = originalFetch;
  });

  it('returns daily costs for a valid admin request', async () => {
    const costs = loadCosts();
    const req = {
      method: 'GET',
      query: { date: '2026-05-25' },
      headers: { 'x-admin-token': 'admin-token' },
    };
    const res = createResponse();

    await costs(req, res);

    assert.equal(res.getStatus(), 200);
    assert.equal(res.getBody().status, 'ok');
    assert.equal(res.getBody().date, '2026-05-25');
    assert.deepEqual(res.getBody().costs, {
      data: [{ amount: 12.34, line_item: 'completions' }],
      next_page: null,
    });
    assert.match(lastFetch.url, /\/organization\/costs\?/);
    assert.match(lastFetch.url, /start_time=\d+/);
    assert.match(lastFetch.url, /end_time=\d+/);
    assert.equal(lastFetch.options.headers.Authorization, 'Bearer openai-admin-key');
  });

  it('rejects invalid dates before calling OpenAI', async () => {
    const costs = loadCosts();
    const req = {
      method: 'GET',
      query: { date: 'not-a-date' },
      headers: { 'x-admin-token': 'admin-token' },
    };
    const res = createResponse();

    await costs(req, res);

    assert.equal(res.getStatus(), 400);
    assert.deepEqual(res.getBody(), { error: 'Nieprawidłowy format daty. Użyj YYYY-MM-DD.' });
  });

  it('rejects missing admin token before calling OpenAI', async () => {
    const costs = loadCosts();
    const req = {
      method: 'GET',
      query: { date: '2026-05-25' },
      headers: {},
    };
    const res = createResponse();

    await costs(req, res);

    assert.equal(res.getStatus(), 401);
    assert.match(res.getBody().error, /Brak autoryzacji/);
    assert.equal(lastFetch, null);
  });

  it('returns 500 when OPENAI_ADMIN_KEY is missing', async () => {
    process.env.OPENAI_ADMIN_KEY = '';
    const costs = loadCosts();
    const req = {
      method: 'GET',
      query: { date: '2026-05-25' },
      headers: { 'x-admin-token': 'admin-token' },
    };
    const res = createResponse();

    await costs(req, res);

    assert.equal(res.getStatus(), 500);
    assert.deepEqual(res.getBody(), { error: 'Brak klucza OpenAI admin API na serwerze.' });
    assert.equal(lastFetch, null);
  });
});
