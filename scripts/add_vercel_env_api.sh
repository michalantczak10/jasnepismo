#!/usr/bin/env bash
# add_vercel_env_api.sh
# Non-interactive: add OPENAI_FALLBACK_MODEL to Vercel using VERCEL_TOKEN
# Usage: VERCEL_TOKEN=xxx ./scripts/add_vercel_env_api.sh PROJECT_ID [MODEL]

set -euo pipefail
if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "ERROR: VERCEL_TOKEN environment variable must be set (create in Vercel dashboard -> Account -> Tokens)." >&2
  exit 1
fi

PROJECT_ID=${1:-}
MODEL=${2:-gpt-3.5-turbo}

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: VERCEL_TOKEN=xxx $0 PROJECT_ID [MODEL]" >&2
  echo "Example: VERCEL_TOKEN=xxx $0 prj_AbCdEf gpt-3.5-turbo" >&2
  exit 1
fi

API_URL="https://api.vercel.com/v9/projects/${PROJECT_ID}/env"

echo "Adding OPENAI_FALLBACK_MODEL=$MODEL to project $PROJECT_ID (production + preview) via Vercel API..."

resp=$(curl -sS -X POST "$API_URL" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"OPENAI_FALLBACK_MODEL\",\"value\":\"${MODEL}\",\"target\":[\"production\",\"preview\"],\"type\":\"encrypted\"}") || true

if echo "$resp" | grep -q 'error'; then
  echo "Vercel API returned an error:" >&2
  echo "$resp" >&2
  exit 1
fi

echo "Vercel API response:"
echo "$resp" | jq -C . || echo "$resp"

echo "Done. You may now trigger a redeploy (vercel deploy --prod --confirm or from dashboard)."
