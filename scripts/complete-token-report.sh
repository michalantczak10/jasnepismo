#!/usr/bin/env bash
# Complete automation: dispatch token-report workflow, wait for completion, download artifacts,
# run aggregation and summary locally.
# Usage: ./scripts/complete-token-report.sh [mode] [days] [ref]
# Example: ./scripts/complete-token-report.sh live 30 main

MODE=${1:-live}
DAYS=${2:-30}
REF=${3:-main}
WORKFLOW=${4:-token-report.yml}
OUTDIR=monitoring/reports
TIMEOUT=${TIMEOUT:-1800} # seconds to wait for run completion (default 30 minutes)

set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install GitHub CLI and authenticate (gh auth login)." >&2
  exit 2
fi

echo "Dispatching workflow $WORKFLOW (mode=$MODE days=$DAYS ref=$REF)..."
gh workflow run "$WORKFLOW" --ref "$REF" -f mode="$MODE" -f days="$DAYS"

# Small delay to let the run be registered
sleep 3

# Find the most recent run for this workflow and branch
run_id=$(gh run list --workflow="$WORKFLOW" --branch="$REF" --limit 1 --json id --jq '.[0].id')
if [ -z "$run_id" ] || [ "$run_id" == "null" ]; then
  echo "Could not determine run id. Use 'gh run list --workflow=$WORKFLOW' to inspect runs." >&2
  exit 3
fi

echo "Run ID: $run_id"

echo "Watching run until completion (timeout ${TIMEOUT}s)..."
# gh run watch will block until completion and return the correct exit code
# but add a timeout wrapper
SECONDS=0
(gh run watch "$run_id") &
watch_pid=$!
while kill -0 "$watch_pid" 2>/dev/null; do
  if [ "$SECONDS" -ge "$TIMEOUT" ]; then
    echo "Timeout waiting for workflow to finish after $TIMEOUT seconds." >&2
    kill "$watch_pid" 2>/dev/null || true
    exit 4
  fi
  sleep 3
done

# At this point the run finished. Download artifacts
mkdir -p "$OUTDIR"

echo "Downloading artifacts for run $run_id to $OUTDIR..."
gh run download "$run_id" -D "$OUTDIR"

echo "Artifacts downloaded. Running aggregation and summary locally..."

node scripts/aggregate-reports.js --days "$DAYS"
node scripts/report-summary.js --days "$DAYS"

echo "Automation complete. See generated files in $OUTDIR and monitoring/reports/."

exit 0
