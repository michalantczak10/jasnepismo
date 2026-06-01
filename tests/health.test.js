const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const health = require('../api/health.js');

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

describe('api/health.js', () => {
  it('returns a health payload without usage data', () => {
    const req = { method: 'GET' };
    const res = createResponse();

    health(req, res);

    assert.equal(res.getStatus(), 200);
    assert.equal(res.getBody().status, 'ok');
    assert.equal(res.getBody().service, 'jasnepismo');
    assert.equal(
      res.getBody().environment === 'local' || res.getBody().environment === 'vercel',
      true
    );
    assert.equal(typeof res.getBody().timestamp, 'string');
    assert.equal(typeof res.getBody().uptime_seconds, 'number');
    assert.equal(Object.prototype.hasOwnProperty.call(res.getBody(), 'last_usage'), false);
  });

  it('returns 405 for non-GET methods', () => {
    const req = { method: 'POST' };
    const res = createResponse();

    health(req, res);

    assert.equal(res.getStatus(), 405);
    assert.equal(res.getHeaders().Allow, 'GET');
    assert.deepEqual(res.getBody(), { error: 'Metoda niedozwolona. Użyj GET.' });
  });
});
