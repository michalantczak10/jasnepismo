import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

type LocalRequest = IncomingMessage & {
  body?: unknown;
  query: Record<string, string | string[]>;
};

type LocalResponse = ServerResponse & {
  status: (code: number) => LocalResponse;
  json: (payload: unknown) => LocalResponse;
  send: (payload: unknown) => LocalResponse;
};

function buildQuery(url: URL): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};

  for (const key of url.searchParams.keys()) {
    const values = url.searchParams.getAll(key);
    query[key] = values.length > 1 ? values : (values[0] ?? '');
  }

  return query;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody) {
    return undefined;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return undefined;
  }
}

function decorateResponse(res: ServerResponse): LocalResponse {
  const response = res as LocalResponse;

  response.status = (code: number): LocalResponse => {
    res.statusCode = code;
    return response;
  };

  response.json = (payload: unknown): LocalResponse => {
    if (!res.hasHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
    return response;
  };

  response.send = (payload: unknown): LocalResponse => {
    if (Buffer.isBuffer(payload) || typeof payload === 'string') {
      res.end(payload);
      return response;
    }

    return response.json(payload);
  };

  return response;
}

async function routeRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const localReq = req as LocalRequest;
  const localRes = decorateResponse(res);

  localReq.query = buildQuery(url);
  localReq.body = req.method === 'POST' ? await readJsonBody(req) : undefined;

  if (url.pathname === '/api/orders') {
    const { default: ordersHandler } = await import('../api/orders.ts');
    await ordersHandler(localReq as never, localRes as never);
    return;
  }

  if (url.pathname === '/api/health') {
    const { default: healthHandler } = await import('../api/health.ts');
    await healthHandler(localReq as never, localRes as never);
    return;
  }

  localRes.status(404).json({ error: 'Not found' });
}

const port = Number(process.env.PORT ?? 3000);

const server = createServer((req, res) => {
  routeRequest(req, res).catch((error: unknown) => {
    console.error('Local API request failed:', error);
    if (!res.headersSent) {
      decorateResponse(res).status(500).json({ error: 'Local API server error' });
      return;
    }
    res.end();
  });
});

server.listen(port, () => {
  console.log(`Local API server running at http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}