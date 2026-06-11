#!/usr/bin/env bash
# Trigger token report workflow using gh (preferred) or GitHub REST API (fallback).
# Usage: ./scripts/trigger-token-report.sh live 30
MODE=${1:-live}
DAYS=${2:-30}

if command -v gh >/dev/null 2>&1; then
  echo "Using gh CLI to trigger workflow (mode=$MODE, days=$DAYS)"
  gh workflow run token-report.yml --ref main -f mode=$MODE -f days=$DAYS
  echo "Triggered. Watch progress with: gh run watch"
  exit 0
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo "GITHUB_TOKEN not set and gh CLI not available. Install gh or export GITHUB_TOKEN." >&2
  exit 2
fi

# try to get owner/repo from git remote
REMO=$(git remote get-url origin 2>/dev/null || true)
if [ -z "$REMO" ]; then
  echo "Cannot determine repo remote. Run from git clone or set GITHUB_REPO env (owner/repo)." >&2
  exit 3
fi

if [[ "$REMO" =~ github.com[:/](.+) ]]; then
  REPO=${BASH_REMATCH[1]}
  REPO=${REPO%.git}
else
  echo "Could not parse origin remote: $REMO" >&2
  exit 4
fi

JSON=$(jq -n --arg ref "main" --arg mode "$MODE" --arg days "$DAYS" '{ref: $ref, inputs: {mode: $mode, days: $days}}')
API="https://api.github.com/repos/$REPO/actions/workflows/token-report.yml/dispatches"

curl -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "$API" -d "$JSON"

echo "Dispatched. Check the workflow run in GitHub Actions."