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
  PATTERN="${PATTERN:+$PATTERN,}secrets_expr"
fi

if grep -R --line-number -n -E "No browsers are installed|No browsers were installed|No browsers installed|Failed to launch|playwright.*No browsers" logs >/dev/null 2>&1; then
  PATTERN="${PATTERN:+$PATTERN,}playwright_browsers"
fi

if grep -R --line-number -n -E "ERR! code ERESOLVE|ERR! ERESOLVE" logs >/dev/null 2>&1; then
  PATTERN="${PATTERN:+$PATTERN,}npm_eresolve"
fi

if grep -R --line-number -n -E "ELIFECYCLE.*npm|npm ERR!.*ELIFECYCLE" logs >/dev/null 2>&1; then
  PATTERN="${PATTERN:+$PATTERN,}npm_elifecycle"
fi

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

  PAYLOAD=$(printf '{"title":"%s","head":"%s","base":"main","body":"%s"}' \
    "$(echo "$TITLE" | sed 's/\"/\\\"/g')" \
    "$(echo "$BRANCH" | sed 's/\"/\\\"/g')" \
    "$(echo "$BODY" | sed 's/\"/\\\"/g')")

  curl -sS -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d "$PAYLOAD" "https://api.github.com/repos/${REPO}/pulls" || true
}

handled=false

# secrets_expr fix
if echo "$PATTERN" | grep -q "secrets_expr"; then
  echo "Detected 'secrets' conditional pattern. Attempting automated fix in .github/workflows/ci.yml"
  if [ -f ".github/workflows/ci.yml" ]; then
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
      create_pr "auto/ci-fix-secrets-${RUN_ID}" "ci: auto-fix workflow secrets conditional" "Automated fix: replace secrets expression with safer env check. Triggered by failing workflow run ${RUN_ID}."
      handled=true
    else
      echo "No changes made to workflow file."
    fi
  else
    echo ".github/workflows/ci.yml not found in checkout." >&2
  fi
fi

# playwright_browsers fix
if echo "$PATTERN" | grep -q "playwright_browsers"; then
  echo "Detected Playwright browsers failure. Attempting to add Playwright install step."
  if [ -f ".github/workflows/ci.yml" ]; then
    python - <<'PY'
from pathlib import Path
p=Path('.github/workflows/ci.yml')
s=p.read_text()
if 'npx playwright install' not in s:
    old='      - name: Install dependencies\n        run: npm ci --silent'
    new=old + '\n\n      - name: Install Playwright browsers\n        run: npx playwright install --with-deps'
    if old in s:
        s=s.replace(old, new)
        p.write_text(s)
        print('patched_playwright')
    else:
        # fallback: try to insert before Run Playwright e2e tests step
        insert_at='      - name: Run Playwright e2e tests'
        idx = s.find(insert_at)
        if idx != -1:
            s = s[:idx] + '\n\n      - name: Install Playwright browsers\n        run: npx playwright install --with-deps\n' + s[idx:]
            p.write_text(s)
            print('patched_playwright_fallback')
        else:
            print('no-match')
else:
    print('already_has_install')
PY
    if git status --porcelain | grep -q .; then
      create_pr "auto/ci-add-playwright-install-${RUN_ID}" "ci: add Playwright browser install step" "Automated fix: add 'npx playwright install --with-deps' after dependencies install. Triggered by failing workflow run ${RUN_ID}."
      handled=true
    else
      echo "No change (maybe workflow already had playwright install step)."
    fi
  else
    echo ".github/workflows/ci.yml not found in checkout." >&2
  fi
fi

# npm_eresolve fix
if echo "$PATTERN" | grep -q "npm_eresolve"; then
  echo "Detected npm ERESOLVE. Attempting to add legacy-peer-deps fallback to npm ci."
  if [ -f ".github/workflows/ci.yml" ]; then
    python - <<'PY'
from pathlib import Path
p=Path('.github/workflows/ci.yml')
s=p.read_text()
old='run: npm ci --silent'
new='run: npm ci --silent || npm ci --silent --legacy-peer-deps'
if old in s and '--legacy-peer-deps' not in s:
    s=s.replace(old, new)
    p.write_text(s)
    print('patched_npm_legacy')
else:
    print('no-change')
PY
    if git status --porcelain | grep -q .; then
      create_pr "auto/ci-npm-legacy-${RUN_ID}" "ci: add npm ci legacy-peer-deps fallback" "Automated fix: add 'npm ci --silent || npm ci --silent --legacy-peer-deps' to Install dependencies step to work around peer dependency resolution failures."
      handled=true
    else
      echo "No changes made for npm."
    fi
  else
    echo ".github/workflows/ci.yml not found in checkout." >&2
  fi
fi

# If we didn't handle anything, create issue with logs
if [ "$handled" = false ]; then
  SNIPPET=$(grep -R --line-number -n -E "error|exception|fail|fatal|unrecognized" logs || true)
  if [ -z "$SNIPPET" ]; then
    SNIPPET=$(find logs -type f -exec tail -n 200 {} + | sed -n '1,400p')
  fi

  BODY=$(printf "CI failed for run %s\n\nLogs snippet:\n\n```\n%s\n```\n\nPlease investigate." "$RUN_ID" "${SNIPPET}")
  PAYLOAD=$(printf '{"title":"%s","body":"%s"}' "CI failed: run ${RUN_ID}" "$(echo "$BODY" | sed 's/\"/\\\"/g')")
  curl -sS -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d "$PAYLOAD" "https://api.github.com/repos/${REPO}/issues" || true

  echo "Created issue with log snippet. Exiting."
fi

