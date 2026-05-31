#!/usr/bin/env bash
set -euo pipefail

echo "Cleanup helper: will show recommended git rm commands to remove large CI artifacts from the repository index"
echo

# patterns to untrack (these match entries added to .gitignore)
patterns=(
  "*.zip"
  "node_modules"
  "actions_run_*"
  "run-*-logs*"
  "baseline-images-*"
  "visual-compare-output-*"
  "artifacts-*"
  "artifacts-run-*.json"
  "jobs-*.json"
  "runs.json"
  "check-*.json"
  "prs-*.json"
)

echo "Scanning git index for tracked files matching artifact patterns..."
echo
for p in "${patterns[@]}"; do
  # list tracked files that match pattern
  matches=$(git ls-files -- "${p}") || true
  if [ -n "$matches" ]; then
    echo "Files tracked matching pattern: $p"
    echo "$matches"
    echo
  fi
done

echo "If you want to remove these files from the repository history (keeping them locally), run the following commands:"
echo
echo "# Remove tracked artifact files from index (keeps local files). Review before running."
echo "# Example: git rm --cached path/to/file.zip"
echo
echo "You can run these commands programmatically by running the script with --do-remove"
echo
if [ "${1-}" = "--do-remove" ]; then
  echo "Removing tracked artifact files from index (git rm --cached)"
  for p in "${patterns[@]}"; do
    git ls-files -- "${p}" | while read -r f; do
      echo "git rm --cached --ignore-unmatch '$f'"
      git rm --cached --ignore-unmatch "$f" || true
    done
  done
  echo
  echo "Done. Please commit the removals and push to remote:"
  echo "  git commit -m 'chore(ci): remove committed CI artifacts from repo'"
  echo "  git push origin <branch>"
fi

echo
echo "NOTE: This script only removes files from the git index. If you need to purge them from history, consider using 'git filter-repo' or 'git filter-branch' (advanced)."


