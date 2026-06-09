Setup Grafana provisioning and assess token savings visually

Quick steps
1. Ensure Grafana can read dashboards:
   - Mount repo monitoring/ directory into the Grafana container.
   - Example docker run: docker run -d -p 3000:3000 \
       -v $(pwd)/monitoring/grafana-dashboard.json:/var/lib/grafana/dashboards/jasnepismo/grafana-dashboard.json \
       -v $(pwd)/monitoring/provisioning/dashboards.yaml:/etc/grafana/provisioning/dashboards/dashboards.yaml \
       grafana/grafana:latest

2. Ensure Prometheus scrapes /api/metrics (use monitoring/prometheus-scrape.yml). Store METRICS_TOKEN on Prometheus host and reference via bearer_token_file.

Add a cumulative counter (recommended)
- For accurate "tokens used over time" add a counter in your app that increments by total_tokens for each completed request. Example (Node):
  global.__jasnepismo_tokens_total = (global.__jasnepismo_tokens_total || 0) + (lastUsage.total_tokens || 0);
  // expose via /api/metrics as jasnepismo_tokens_total (counter)

PromQL & Grafana panels to create
- Tokens per minute: increase(jasnepismo_tokens_total[5m])
- Tokens last 7 days: increase(jasnepismo_tokens_total[7d])
- Percentage change after change: (increase(jasnepismo_tokens_total[7d]) - increase(jasnepismo_tokens_total[7d] offset 7d)) / increase(jasnepismo_tokens_total[7d] offset 7d) * 100
- Cache hit rate (existing): sum(rate(jasnepismo_cache_hits[5m])) / (sum(rate(jasnepismo_cache_hits[5m])) + sum(rate(jasnepismo_cache_misses[5m])) ) * 100

Visual assessment checklist
- Compare total tokens for equal windows before vs after deployment (7d recommended).
- Use Grafana "Compare to previous period" or time shift (offset) to show side-by-side.
- Plot tokens/min + request rate to ensure savings are not caused by fewer requests.
- Correlate hit rate increase with token decrease.

Notes
- For multi-instance deployments use a Prometheus client lib to maintain counters per instance or a Pushgateway.
- Gauges like jasnepismo_last_usage_* are useful for single-request diagnostics but not for cumulative sums.

If you want, add the counter to /api/metrics now and I will add two Grafana panels and a comparison rule.

Enable nightly snapshots via GitHub Actions

1. Add repository secrets (Settings → Secrets & variables → Actions) or use gh CLI:
   - METRICS_URL = https://your-host.example.com/api/metrics
   - METRICS_TOKEN = <token> (optional)

2. (Optional) Run the helper to set secrets using gh locally:
   ./scripts/set-github-secrets.sh owner/repo "https://your-host.example.com/api/metrics" "<METRICS_TOKEN>"

3. The workflow .github/workflows/snapshot-metrics.yml is configured to run daily and will upload artifacts with raw metrics text.

Installing accurate estimator (tiktoken)

- Try automated helper:
  ./scripts/install-tiktoken.sh
- If it fails, install according to https://github.com/openai/tiktoken for your platform and then set env USE_TIKTOKEN=1 in the service environment.

Local snapshot and debug

- Create an immediate snapshot locally:
  node scripts/snapshot-tokens.js
- Check current counters:
  node -e "const o=require('../api/openai'); console.log(o.getTotalTokens(), o.getTheoreticalTokens(), o.getCompressedTokens())"

Security

- Keep METRICS_TOKEN secret; store it in Prometheus host as bearer_token_file as documented earlier.

Notes on next steps

- After secrets are in place the GitHub Action will collect /api/metrics daily and store artifacts. You can download artifacts from the Actions UI to inspect historical metrics.
- If you want, I can also add a simple workflow that converts those raw metric files into JSON snapshots automatically (parse the text and extract counters). Ask and I'll add it.