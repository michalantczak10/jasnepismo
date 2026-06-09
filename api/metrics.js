module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }

  // Optional protection: set METRICS_TOKEN in env to require a token for scraping
  const METRICS_TOKEN = process.env.METRICS_TOKEN;
  if (METRICS_TOKEN) {
    const auth = req.headers && (req.headers.authorization || req.headers['x-metrics-token']);
    if (!auth) return res.status(401).json({ error: 'Brak nagłówka autoryzacji.' });
    let token = auth;
    if (typeof token === 'string' && token.toLowerCase().startsWith('bearer '))
      token = token.slice(7).trim();
    if (token !== METRICS_TOKEN) return res.status(403).json({ error: 'Nieautoryzowany dostęp.' });
  }

  try {
    const openai = require('./openai');
    const stats = typeof openai.getCacheStats === 'function' ? openai.getCacheStats() : {};
    const lastUsage = typeof openai.getLastUsage === 'function' ? openai.getLastUsage() : null;

    const lines = [];
    lines.push('# HELP jasnepismo_cache_hits Number of cache hits');
    lines.push('# TYPE jasnepismo_cache_hits counter');
    lines.push('jasnepismo_cache_hits ' + (stats.hits || 0));

    lines.push('# HELP jasnepismo_cache_misses Number of cache misses');
    lines.push('# TYPE jasnepismo_cache_misses counter');
    lines.push('jasnepismo_cache_misses ' + (stats.misses || 0));

    lines.push('# HELP jasnepismo_cache_size Current cache size (items)');
    lines.push('# TYPE jasnepismo_cache_size gauge');
    lines.push('jasnepismo_cache_size ' + (stats.size || 0));

    lines.push('# HELP jasnepismo_cache_max_entries Configured maximum cache entries');
    lines.push('# TYPE jasnepismo_cache_max_entries gauge');
    lines.push('jasnepismo_cache_max_entries ' + (stats.max_entries || 0));

    lines.push('# HELP jasnepismo_cache_ttl_ms Cache TTL in milliseconds');
    lines.push('# TYPE jasnepismo_cache_ttl_ms gauge');
    lines.push('jasnepismo_cache_ttl_ms ' + (stats.ttl_ms || 0));

    if (lastUsage) {
      lines.push('# HELP jasnepismo_last_usage_prompt_tokens Last request prompt tokens');
      lines.push('# TYPE jasnepismo_last_usage_prompt_tokens gauge');
      lines.push('jasnepismo_last_usage_prompt_tokens ' + (lastUsage.prompt_tokens || 0));

      lines.push('# HELP jasnepismo_last_usage_completion_tokens Last request completion tokens');
      lines.push('# TYPE jasnepismo_last_usage_completion_tokens gauge');
      lines.push('jasnepismo_last_usage_completion_tokens ' + (lastUsage.completion_tokens || 0));

      lines.push('# HELP jasnepismo_last_usage_total_tokens Last request total tokens');
      lines.push('# TYPE jasnepismo_last_usage_total_tokens gauge');
      lines.push('jasnepismo_last_usage_total_tokens ' + (lastUsage.total_tokens || 0));
    }

    // Expose cumulative tokens counters if the application provides them
    const totalTokens = typeof openai.getTotalTokens === 'function' ? Number(openai.getTotalTokens()) : 0;
    const theoretical = typeof openai.getTheoreticalTokens === 'function' ? Number(openai.getTheoreticalTokens()) : 0;
    const compressedTotal = typeof openai.getCompressedTokens === 'function' ? Number(openai.getCompressedTokens()) : 0;

    lines.push('# HELP jasnepismo_theoretical_tokens_total Theoretical tokens if prompts were not compressed');
    lines.push('# TYPE jasnepismo_theoretical_tokens_total counter');
    lines.push('jasnepismo_theoretical_tokens_total ' + (theoretical || 0));

    lines.push('# HELP jasnepismo_compressed_tokens_total Tokens estimated for compressed prompts');
    lines.push('# TYPE jasnepismo_compressed_tokens_total counter');
    lines.push('jasnepismo_compressed_tokens_total ' + (compressedTotal || 0));

    lines.push('# HELP jasnepismo_tokens_total Cumulative tokens used');
    lines.push('# TYPE jasnepismo_tokens_total counter');
    lines.push('jasnepismo_tokens_total ' + (totalTokens || 0));

    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return res.status(200).end(lines.join('\n') + '\n');
  } catch (e) {
    console.error('Error in /api/metrics:', e);
    return res.status(500).json({ error: 'Błąd serwera.' });
  }
};
