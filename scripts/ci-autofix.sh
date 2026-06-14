#!/usr/bin/env bash
set -euo pipefail

# CI auto-fix script: download logs for failing workflow run, attempt safe fixes for known issues,
# and create a PR or issue with diagnostics when no automated fix is available.

REPO=${REPO:-${GITHUB_REPOSITORY:-}}
RUN_ID=${RUN_ID:-${GITHUB_RUN_ID:-}}
TOKEN=${GITHUB_TOKEN:-}

if [ -z "$RUN_ID" ]; then
  echo "RUN_ID not set; cannot proceed." >&2
  exit 0
fi

if [ -z "$REPO" ]; then
  echo "REPO not set; cannot proceed." >&2
  exit 0
fi

LOG_URL="https://api.github.com/repos/${REPO}/actions/runs/${RUN_ID}/logs"

echo "Downloading logs for run ${RUN_ID}..."
if ! curl -sS -H "Authorization: Bearer ${TOKEN}" -L -o logs.zip "${LOG_URL}"; then
  echo "Failed to download logs or no access. Creating issue for manual investigation." >&2
fi

mkdir -p logs
unzip -q logs.zip -d logs || true

echo "Scanning logs for known failure patterns..."
PATTERN=""
if grep -R --line-number -n "Unrecognized named-value: 'secrets'" logs >/dev/null 2>&1; then
  PATTERN="secrets_expr"
fi

# Helper: create branch, commit, push and open PR using the GitHub API
create_pr() {
  BRANCH="$1"
  TITLE="$2"
  BODY="$3"
  git config user.email "actions@github.com"
  git config user.name "CI Auto Fix"
  git checkout -b "$BRANCH"
  git add -A
  git commit -m "$TITLE" -m "Co-authored-by: CI Auto Fix <action@github.com>" || true
  git push --set-upstream origin "$BRANCH" || true

  # Create PR via API
  PAYLOAD=$(printf '{"title":"%s","head":"%s","base":"main","body":"%s"}' "${TITLE//"/\"}" "${BRANCH//"/\"}" "${BODY//"/\"}")
  curl -sS -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d "$PAYLOAD" "https://api.github.com/repos/${REPO}/pulls" || true
}

if [ "$PATTERN" = "secrets_expr" ]; then
  echo "Detected 'secrets' conditional pattern. Attempting automated fix in .github/workflows/ci.yml"
  if [ -f ".github/workflows/ci.yml" ]; then
    # Patch the file: replace if: ${{ secrets.VERCEL_TOKEN }} with a safer conditional
    python - <<'PY'
from pathlib import Path
p=Path('.github/workflows/ci.yml')
s=p.read_text()
old='if: ${{ secrets.VERCEL_TOKEN }}'
new='if: ${{ env.VERCEL_TOKEN != "" }}'
if old in s:
    s=s.replace(old,new)
    p.write_text(s)
    print('patched')
else:
    print('no-change')
PY

    if git status --porcelain | grep -q .; then
      BRANCH="auto/ci-fix-secrets-${RUN_ID}"
      TITLE="ci: auto-fix workflow secrets conditional"
      BODY="Automated fix: replace secrets expression with safer env check. Triggered by failing workflow run ${RUN_ID}."
      create_pr "$BRANCH" "$TITLE" "$BODY"
      echo "Created branch and PR for fix."
      exit 0
    else
      echo "No changes made to workflow file."
    fi
  else
    echo ".github/workflows/ci.yml not found in checkout." >&2
  fi
fi

# No automated fix applied: create an issue with a logs snippet to help triage
SNIPPET=$(grep -R --line-number -n -E "error|exception|fail|fatal|unrecognized" logs || true)
if [ -z "$SNIPPET" ]; then
  SNIPPET=$(find logs -type f -exec tail -n 200 {} + | sed -n '1,400p')
fi

BODY=$(printf "CI failed for run %s\n\nLogs snippet:\n\n```\n%s\n```\n\nPlease investigate." "$RUN_ID" "${SNIPPET}")

PAYLOAD=$(printf '{"title":"%s","body":"%s"}' "CI failed: run ${RUN_ID}" "${BODY//"/\"}")
curl -sS -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d "$PAYLOAD" "https://api.github.com/repos/${REPO}/issues" || true

echo "Created issue with log snippet. Exiting." 
