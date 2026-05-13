import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';

dotenv.config({ path: '.env.local' });
dotenv.config();

declare global {
  // eslint-disable-next-line no-var
  var __mongoClient: MongoClient | undefined;
}

const MONGODB_URI = process.env['MONGODB_URI'];
let cachedClient: MongoClient | null = globalThis.__mongoClient ?? null;

async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  globalThis.__mongoClient = client;
  return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const health: {
    status: string;
    service: string;
    environment: string;
    timestamp: string;
    database: { connected: boolean; error?: string; message?: string };
  } = {
    status: 'ok',
    service: 'szkolnegazetki-api',
    environment: process.env['NODE_ENV'] ?? 'development',
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
    },
  };

  if (MONGODB_URI) {
    try {
      const client = await getMongoClient();
      await client.db().command({ ping: 1 });
      health.database.connected = true;
    } catch (error) {
      health.database.connected = false;
      health.database.error = String(error);
    }
  } else {
    health.database.message = 'MONGODB_URI is not configured';
  }

  res.status(200).json(health);
}
