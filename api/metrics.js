// Enhanced in-memory metrics collector with detailed tracking
// Supports rate limiting, OCR processing, and request metrics
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
  const memory = process.memoryUsage();
  return Object.assign({}, metrics, {
    uptime_seconds: Math.floor(process.uptime()),
    memory: {
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
    },
    rate_limit: {
      allowed: get('rate_limit.allowed'),
      blocked: get('rate_limit.blocked'),
      blocked_percentage:
        get('rate_limit.allowed') > 0
          ? Math.round(
              (get('rate_limit.blocked') /
                (get('rate_limit.allowed') + get('rate_limit.blocked'))) *
                100
            )
          : 0,
    },
    ocr: {
      jobs_started: get('ocr.jobs.started'),
      jobs_succeeded: get('ocr.jobs.succeeded'),
      jobs_failed: get('ocr.jobs.failed'),
      success_rate:
        get('ocr.jobs.started') > 0
          ? Math.round((get('ocr.jobs.succeeded') / get('ocr.jobs.started')) * 100)
          : 0,
    },
    openai: {
      calls: get('openai.calls'),
    },
    requests: {
      incoming: get('request.incoming'),
      processed: get('request.process.start'),
      rejected_rate: get('request.rejected_rate'),
      rejected_percentage:
        get('request.incoming') > 0
          ? Math.round((get('request.rejected_rate') / get('request.incoming')) * 100)
          : 0,
    },
    text: {
      normalized: get('text.normalized'),
    },
  });
}

module.exports = { inc, dec, set, get, getAll };
