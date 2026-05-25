const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join('/tmp', 'jasnepismo');
const STORAGE_FILE = path.join(STORAGE_DIR, 'payments.json');
let paymentStore = null;

function ensureStorage() {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  } catch (error) {
    // ignore write errors in environments without /tmp
  }
}

function loadStore() {
  if (paymentStore) {
    return paymentStore;
  }

  ensureStorage();

  try {
    const data = fs.readFileSync(STORAGE_FILE, 'utf8');
    paymentStore = data ? JSON.parse(data) : {};
  } catch (error) {
    paymentStore = {};
  }

  return paymentStore;
}

function saveStore() {
  ensureStorage();
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(paymentStore, null, 2), 'utf8');
  } catch (error) {
    // ignore write errors on platform without ephemeral disk access
  }
}

function createPaymentSession(text) {
  const session = {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    amount: 100,
    currency: 'PLN',
    status: 'pending',
    createdAt: new Date().toISOString(),
    explanation: null
  };

  const store = loadStore();
  store[session.id] = session;
  saveStore();
  return session;
}

function getPaymentSession(paymentId) {
  const store = loadStore();
  return store[paymentId] || null;
}

function updatePaymentSession(paymentId, update) {
  const store = loadStore();
  if (!store[paymentId]) {
    return null;
  }

  store[paymentId] = {
    ...store[paymentId],
    ...update,
    updatedAt: new Date().toISOString()
  };

  saveStore();
  return store[paymentId];
}

module.exports = {
  createPaymentSession,
  getPaymentSession,
  updatePaymentSession
};
