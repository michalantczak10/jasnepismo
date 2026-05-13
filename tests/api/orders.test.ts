import test from 'node:test';
import assert from 'node:assert/strict';

type MockRequest = {
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  socket: { remoteAddress: string };
};

type MockResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  ended: boolean;
  setHeader: (key: string, value: string) => void;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  end: (payload?: string) => MockResponse;
};

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    ended: false,
    setHeader(key: string, value: string): void {
      this.headers[key] = value;
    },
    status(code: number): MockResponse {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown): MockResponse {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
      this.body = JSON.stringify(payload);
      this.ended = true;
      return this;
    },
    end(payload = ''): MockResponse {
      this.body = payload;
      this.ended = true;
      return this;
    },
  };
}

async function loadOrdersHandler(): Promise<(req: MockRequest, res: MockResponse) => Promise<void>> {
  process.env.MONGODB_URI = 'mongodb://example.invalid/szkolnegazetki';
  process.env.ORDER_EMAIL = 'zamowienia@szkolnegazetki.pl';
  process.env.RESEND_FROM_EMAIL = 'zamowienia@szkolnegazetki.pl';
  process.env.RESEND_API_KEY = '';

  const modulePath = `../../api/orders.ts?test=${Date.now()}-${Math.random()}`;
  const imported = await import(modulePath);
  return imported.default as (req: MockRequest, res: MockResponse) => Promise<void>;
}

test('orders handler responds to OPTIONS with CORS headers', async () => {
  const handler = await loadOrdersHandler();
  const req: MockRequest = {
    method: 'OPTIONS',
    headers: { origin: 'http://localhost:5173' },
    socket: { remoteAddress: '127.0.0.1' },
  };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'http://localhost:5173');
  assert.equal(res.headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
});

test('orders handler rejects unsupported methods', async () => {
  const handler = await loadOrdersHandler();
  const req: MockRequest = {
    method: 'GET',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'POST');
});

test('orders handler validates empty cart before database write', async () => {
  const handler = await loadOrdersHandler();
  const req: MockRequest = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: {
      customerName: 'Anna Nowak',
      customerEmail: 'anna@example.com',
      customerPhone: '500600700',
      paymentMethod: 'bank_transfer',
      notes: '',
      items: [],
    },
    socket: { remoteAddress: '127.0.0.1' },
  };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body, /Koszyk jest pusty/);
});