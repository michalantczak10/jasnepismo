const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const costs = require('../api/costs.js');

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

describe('api/costs.js', () => {
  const originalAdmin = process.env.ADMIN_API_TOKEN;
  const originalAdminKey = process.env.OPENAI_ADMIN_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    // preserve environment between tests
    process.env.OPENAI_ADMIN_KEY = originalAdminKey;
    process.env.ADMIN_API_TOKEN = originalAdmin;
  });

  afterEach(() => {
    process.env.ADMIN_API_TOKEN = originalAdmin;
    process.env.OPENAI_ADMIN_KEY = originalAdminKey;
    global.fetch = originalFetch;
  });

  it('returns 405 for non-GET methods', async () => {
    const req = { method: 'POST' };
    const res = createResponse();

    await costs(req, res);

    assert.equal(res.getStatus(), 405);
    assert.equal(res.getHeaders().Allow, 'GET');
    assert.deepEqual(res.getBody(), { error: 'Metoda niedozwolona. Użyj GET.' });
  });

  it('returns 501 when ADMIN_API_TOKEN missing', async () => {
    process.env.ADMIN_API_TOKEN = '';
    process.env.OPENAI_ADMIN_KEY = '';

    const req = { method: 'GET' };
    const res = createResponse();

    await costs(req, res);

    assert.equal(res.getStatus(), 501);
    assert.deepEqual(res.getBody(), { error: 'Endpoint nie jest skonfigurowany. Brakuje ADMIN_API_TOKEN.' });
  });

  it('returns 403 when token mismatch', async () => {
    process.env.ADMIN_API_TOKEN = 'secret';
    process.env.OPENAI_ADMIN_KEY = '';

    const req = { method: 'GET', headers: {} };
    const res = createResponse();

    await costs(req, res);

    assert.equal(res.getStatus(), 403);
    assert.deepEqual(res.getBody(), { error: 'Brak dostępu.' });
  });

  it('returns costs when token matches and OpenAI returns data', async () => {
    process.env.ADMIN_API_TOKEN = 'secret';
    process.env.OPENAI_ADMIN_KEY = 'adminkey';

    global.fetch = async () => ({ ok: true, json: async () => ({ total: 123.45 }), status: 200 });

    const req = { method: 'GET', headers: { 'x-admin-token': 'secret' }, query: { date: '2026-05-25' } };
    const res = createResponse();

    await costs(req, res);

    assert.equal(res.getStatus(), 200);
    assert.equal(res.getBody().date, '2026-05-25');
    assert.deepEqual(res.getBody().costs, { total: 123.45 });
  });
});
