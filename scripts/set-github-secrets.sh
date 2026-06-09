#!/usr/bin/env bash
# Usage: ./set-github-secrets.sh <repo> <METRICS_URL> <METRICS_TOKEN (optional)>
# Requires gh CLI authenticated (gh auth login)
set -euo pipefail

REPO="$1"
METRICS_URL="$2"
METRICS_TOKEN="${3:-}"

if [ -z "$REPO" ] || [ -z "$METRICS_URL" ]; then
  echo "Usage: $0 <owner/repo> <METRICS_URL> [METRICS_TOKEN]"
  exit 1
fi

echo "Setting METRICS_URL secret for $REPO"
echo "$METRICS_URL" | gh secret set METRICS_URL --repo "$REPO" --body -
if [ -n "$METRICS_TOKEN" ]; then
  echo "Setting METRICS_TOKEN secret for $REPO"
  echo "$METRICS_TOKEN" | gh secret set METRICS_TOKEN --repo "$REPO" --body -
fi

echo "Secrets set. Ensure the workflow .github/workflows/snapshot-metrics.yml is enabled."
