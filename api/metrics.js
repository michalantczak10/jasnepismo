// Simple in-memory metrics collector. Per-instance only — good for logs and basic health checks.
// For global metrics use Prometheus/Pushgateway or a hosted metrics service.
const metrics = {};

function inc(key, value = 1) {
  metrics[key] = (metrics[key] || 0) + value;
}

function dec(key, value = 1) {
  metrics[key] = (metrics[key] || 0) - value;
  if (metrics[key] < 0) metrics[key] = 0;
}

function set(key, value) {
  metrics[key] = value;
}

function get(key) {
  return metrics[key] || 0;
}

function getAll() {
  return Object.assign({}, metrics, {
    uptime_seconds: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
  });
}

module.exports = { inc, dec, set, get, getAll };
