# Monitoring README

Enable METRICS_TOKEN on the host
- Recommended: write the token to a file on the Prometheus host (example: /etc/metrics/METRICS_TOKEN) and use bearer_token_file in Prometheus.
- Alternative: export METRICS_TOKEN in the scraping host environment and configure Prometheus to use it (see your Prometheus deployment docs).

Prometheus
- Add the snippet from prometheus-scrape.yml to your prometheus.yml (or include the file). Replace HOST:PORT with your service address and ensure metrics_path is /api/metrics.

Grafana
- Use the PromQL examples in grafana-queries.md to create panels:
  - Cache hit rate: Time series or Stat panel, unit = percent.
  - Top tokens by last usage: Table or Bar panel using the topk() query.

Calculating savings
- Estimate saved requests or compute savings as:
  savings = hit_rate * requests * avg_request_cost
  where hit_rate is from Prometheus (0..1), requests is total requests over period, avg_request_cost is a monetary/CPU cost per request.

Replace placeholder metric names and labels with the actual metrics your application exposes.
