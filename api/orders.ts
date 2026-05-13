import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

dotenv.config({ path: '.env.local' });
dotenv.config();

declare global {
  // eslint-disable-next-line no-var
  var __mongoClient: MongoClient | undefined;
}

const MONGODB_URI = process.env['MONGODB_URI'];
const MONGODB_DB_NAME = process.env['MONGODB_DB_NAME'];
const ORDERS_COLLECTION = process.env['ORDERS_COLLECTION'] ?? 'orders';
const ORDER_EMAIL = process.env['ORDER_EMAIL'];
const RESEND_API_KEY = process.env['RESEND_API_KEY'];
const RESEND_FROM_EMAIL =
  process.env['RESEND_FROM_EMAIL'] ?? 'noreply@szkolnegazetki.pl';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

interface RateLimitEntry {
  start: number;
  count: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  entry.count++;
  return false;
}

let cachedClient: MongoClient | null = globalThis.__mongoClient ?? null;

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isEmailValid(email: string): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPhoneValid(phone: unknown): boolean {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 9 && cleaned.length <= 15;
}

function formatOrderRef(orderId: string): string {
  return `SZG-${orderId.slice(-6).toUpperCase()}`;
}

function getPaymentTarget(paymentMethod: string): string {
  if (paymentMethod === 'blik') {
    return 'BLIK na telefon: 794 535 366';
  }
  return '60 1140 2004 0000 3102 4831 8846 (Szkolne gazetki)';
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

interface OrderItem {
  name: string;
  price: number;
  qty: number;
}

interface OrderRecord {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  notes: string;
  items: OrderItem[];
  productsTotal: number;
  total: number;
  status: string;
  paymentStatus: string;
  transferTitle: string;
  createdAt: Date;
  updatedAt: Date;
  environment: string;
  notificationStatus: 'pending' | 'accepted' | 'skipped' | 'failed';
  notificationMessageId?: string;
  notificationError?: string;
  notificationSentAt?: Date;
  notificationUpdatedAt?: Date;
  orderId?: string;
  orderRef?: string;
  paymentTarget?: string;
}

interface OrderNotificationResult {
  status: 'accepted' | 'skipped' | 'failed';
  messageId?: string;
  error?: string;
  sentAt?: Date;
}

async function sendOrderNotification(order: OrderRecord): Promise<OrderNotificationResult> {
  if (!resend || !ORDER_EMAIL) {
    console.warn('Order notification skipped: missing RESEND_API_KEY or ORDER_EMAIL');
    return {
      status: 'skipped',
      error: 'missing RESEND_API_KEY or ORDER_EMAIL',
    };
  }

  const itemsHtml = order.items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.name)}</strong> — ${item.qty} lic. × ${item.price} zł = ${item.qty * item.price} zł</li>`,
    )
    .join('');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#111827;padding:20px;">
      <h2 style="color:#1d4ed8;">Nowe zamówienie</h2>
      <p>Numer zamówienia: <strong>${escapeHtml(order.orderRef)}</strong></p>
      <p>Nauczyciel: <strong>${escapeHtml(order.customerName)}</strong></p>
      <p>E-mail: <strong>${escapeHtml(order.customerEmail)}</strong></p>
      <p>Telefon: <strong>${escapeHtml(order.customerPhone || 'brak')}</strong></p>
      <p>Metoda płatności: <strong>${escapeHtml(order.paymentMethod)}</strong></p>
      <p>Kwota do zapłaty: <strong>${order.total} zł</strong></p>
      <p>Tytuł przelewu: <strong>${escapeHtml(order.transferTitle)}</strong></p>
      <h3>Produkty</h3>
      <ul>${itemsHtml}</ul>
      <p>Uwagi: <strong>${escapeHtml(order.notes || 'brak')}</strong></p>
    </div>
  `;

  const result = await resend.emails.send({
    to: ORDER_EMAIL,
    from: RESEND_FROM_EMAIL,
    subject: `Nowe zamówienie ${order.orderRef ?? ''}`,
    html,
  });

  if (result.error) {
    return {
      status: 'failed',
      error: `Resend rejected email: ${result.error.message}`,
    };
  }

  console.info(`Order notification accepted by Resend for ${order.orderRef ?? 'unknown-order'}`);

  return {
    status: 'accepted',
    messageId: result.data?.id,
    sentAt: new Date(),
  };
}

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function setCorsHeaders(req: VercelRequest, res: VercelResponse): void {
  const origin = typeof req.headers['origin'] === 'string' ? req.headers['origin'] : '';
  if (DEV_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientIp: string =
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
      : undefined) ??
    req.socket?.remoteAddress ??
    'unknown';

  if (isRateLimited(clientIp)) {
    res.status(429).json({ error: 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.' });
    return;
  }

  if (!MONGODB_URI) {
    res.status(500).json({ error: 'MONGODB_URI is not configured' });
    return;
  }

  const body = req.body as Record<string, unknown> | undefined ?? {};

  const { customerName, customerEmail, customerPhone, paymentMethod, notes, items } = body;

  const normalizedEmail = normalizeEmail(customerEmail);
  const trimmedName = typeof customerName === 'string' ? customerName.trim() : '';
  const trimmedNotes = typeof notes === 'string' ? notes.trim() : '';
  const selectedPaymentMethod = paymentMethod === 'blik' ? 'blik' : 'bank_transfer';

  if (!isEmailValid(normalizedEmail)) {
    res.status(400).json({ error: 'Podaj poprawny adres e-mail.' });
    return;
  }

  if (customerPhone && !isPhoneValid(customerPhone)) {
    res.status(400).json({ error: 'Podaj poprawny numer telefonu.' });
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Koszyk jest pusty.' });
    return;
  }

  const normalizedItems: OrderItem[] = [];
  for (const item of items as unknown[]) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof (item as Record<string, unknown>)['name'] !== 'string' ||
      ((item as Record<string, unknown>)['name'] as string).trim().length === 0 ||
      typeof (item as Record<string, unknown>)['price'] !== 'number' ||
      !Number.isFinite((item as Record<string, unknown>)['price'] as number) ||
      ((item as Record<string, unknown>)['price'] as number) <= 0 ||
      typeof (item as Record<string, unknown>)['qty'] !== 'number' ||
      !Number.isInteger((item as Record<string, unknown>)['qty'] as number) ||
      ((item as Record<string, unknown>)['qty'] as number) <= 0
    ) {
      res.status(400).json({ error: 'Nieprawidłowe pozycje w koszyku.' });
      return;
    }

    normalizedItems.push({
      name: ((item as Record<string, unknown>)['name'] as string).trim(),
      price: (item as Record<string, unknown>)['price'] as number,
      qty: (item as Record<string, unknown>)['qty'] as number,
    });
  }

  const productsTotal = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = productsTotal;

  const order: OrderRecord = {
    customerName: trimmedName || 'Klient (bez imienia i nazwiska)',
    customerEmail: normalizedEmail,
    customerPhone: typeof customerPhone === 'string' ? customerPhone.replace(/\D/g, '') : '',
    paymentMethod: selectedPaymentMethod,
    notes: trimmedNotes,
    items: normalizedItems,
    productsTotal,
    total,
    status: 'pending_payment',
    paymentStatus: 'pending',
    transferTitle: `Zamówienie ${formatOrderRef('XXXXXX')}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    environment: process.env['NODE_ENV'] ?? 'development',
    notificationStatus: 'pending',
  };

  try {
    const client = await getMongoClient();
    const db = MONGODB_DB_NAME ? client.db(MONGODB_DB_NAME) : client.db();
    const collection = db.collection(ORDERS_COLLECTION);
    const result = await collection.insertOne(order);
    const orderId = result.insertedId.toString();
    const orderRef = formatOrderRef(orderId);
    const transferTitle = `Zamówienie ${orderRef}`;
    const paymentTarget = getPaymentTarget(selectedPaymentMethod);

    await collection.updateOne(
      { _id: result.insertedId },
      { $set: { orderRef, transferTitle, paymentTarget, updatedAt: new Date() } },
    );

    const orderRecord: OrderRecord = {
      ...order,
      orderId,
      orderRef,
      transferTitle,
      paymentTarget,
    };

    let notificationResult: OrderNotificationResult;
    try {
      notificationResult = await sendOrderNotification(orderRecord);
    } catch (error) {
      notificationResult = {
        status: 'failed',
        error: (error as Error)?.message ?? String(error),
      };
      console.error('Order notification failed:', notificationResult.error);
    }

    await collection.updateOne(
      { _id: result.insertedId },
      {
        $set: {
          notificationStatus: notificationResult.status,
          notificationMessageId: notificationResult.messageId ?? null,
          notificationError: notificationResult.error ?? null,
          notificationSentAt: notificationResult.sentAt ?? null,
          notificationUpdatedAt: new Date(),
        },
      },
    );

    res.status(201).json({
      success: true,
      orderId,
      orderRef,
      transferTitle,
      paymentTarget,
      total,
      message:
        'Dziękujemy! Zamówienie nauczyciela zostało zapisane. Link do zakupionych materiałów wyślemy ręcznie po zaksięgowaniu płatności.',
      status: 'pending_payment',
    });
  } catch (error) {
    console.error('Order save failed:', (error as Error)?.message ?? error);
    res.status(500).json({ error: 'Błąd zapisu zamówienia. Spróbuj ponownie.' });
  }
}
