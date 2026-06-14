let sentry = null;
try {
  // Initialize Sentry only when DSN is provided and package is installed
  const Sentry = require('@sentry/node');
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      release: process.env.RELEASE || undefined,
    });
    sentry = Sentry;
  }
} catch (e) {
  // Sentry is optional; if not installed or not configured, continue without it
  // console.warn('Sentry not initialized:', e && e.message);
}

module.exports = {
  captureException: (err) => {
    try {
      if (sentry && typeof sentry.captureException === 'function') sentry.captureException(err);
    } catch (e) {
      // ignore
    }
    // always log to console for fallback
    if (err && err.stack) console.error('Captured exception:', err.stack);
  },
  captureMessage: (msg) => {
    try {
      if (sentry && typeof sentry.captureMessage === 'function') sentry.captureMessage(msg);
    } catch (e) {}
    if (msg) console.log('Captured message:', msg);
  },
};