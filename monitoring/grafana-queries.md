# Grafana PromQL examples

# Cache hit rate (percentage)
# Requires two counters: cache_hits_total and cache_requests_total
sum(rate(cache_hits_total[5m])) / sum(rate(cache_requests_total[5m])) * 100

# Cache hit rate by cache (label: cache)
sum by (cache) (rate(cache_hits_total[5m])) / sum by (cache) (rate(cache_requests_total[5m])) * 100

# Top tokens by last usage (assuming a gauge token_last_used_timestamp_seconds labeled by token)
topk(20, max by (token) (token_last_used_timestamp_seconds))

# Last-used timestamp for a single token (replace TOKEN_LABEL)
max by (token) (token_last_used_timestamp_seconds{token="TOKEN_LABEL"})

# Panel notes:
# - Create a Time series or Stat panel for hit rate, set unit as percent.
# - For "Top tokens" use a Table or Bar chart with the token label.
