#!/usr/bin/env bash
# add_vercel_env.sh — add OPENAI_FALLBACK_MODEL to Vercel (production + preview)
# Usage: chmod +x scripts/add_vercel_env.sh && ./scripts/add_vercel_env.sh [MODEL]

set -euo pipefail
MODEL=${1:-gpt-3.5-turbo}
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI not found — installing globally (requires npm)..."
  npm i -g vercel
fi

echo "Ensure you're logged in to Vercel. If not, the CLI will prompt you."
vercel login || true

# Link project (interactive if not linked). Use --yes to accept defaults if available.
vercel link --yes || true

# Try non-interactive add by piping the value. If it fails, print instructions.
printf "%s\n" "$MODEL" | vercel env add OPENAI_FALLBACK_MODEL production || {
  echo "Interactive flow failed — please run:\n  vercel env add OPENAI_FALLBACK_MODEL production\nand enter: $MODEL"
}

printf "%s\n" "$MODEL" | vercel env add OPENAI_FALLBACK_MODEL preview || {
  echo "Interactive flow failed — please run:\n  vercel env add OPENAI_FALLBACK_MODEL preview\nand enter: $MODEL"
}

echo "Environment variables set. Redeploying production (this will create a new deployment)..."
vercel deploy --prod --confirm || echo "Deploy failed or cancelled. You can deploy from Vercel dashboard."

echo "Done. Verify in Vercel dashboard (Project → Settings → Environment Variables)."