param(
  [switch]$DoRemove
)

Write-Host "Cleanup helper (PowerShell): will show recommended git rm commands to remove large CI artifacts from the repository index"

$patterns = @(
  'node_modules',
  '*.zip',
  'actions_run_*',
  'run-*-logs*',
  'baseline-images-*',
  'visual-compare-output-*',
  'artifacts-*',
  'artifacts-run-*.json',
  'jobs-*.json',
  'runs.json',
  'check-*.json',
  'prs-*.json'
)

Write-Host "Scanning git index for tracked files matching artifact patterns..."
foreach ($p in $patterns) {
  $matches = git ls-files -- $p 2>$null
  if ($matches) {
    Write-Host "Files tracked matching pattern: $p"
    $matches
    Write-Host
  }
}

Write-Host "If you want to remove these files from the repository index (keeping local files), run the script with -DoRemove." -ForegroundColor Yellow
if ($DoRemove) {
  Write-Host "Removing tracked artifact files from index (git rm --cached)"
  foreach ($p in $patterns) {
    git ls-files -- $p 2>$null | ForEach-Object {
      $f = $_.Trim()
      if ($f) {
        Write-Host "git rm --cached --ignore-unmatch '$f'"
        git rm --cached --ignore-unmatch -- "$f" | Out-Null
      }
    }
  }
  Write-Host "Done. Please commit the removals and push to remote:`n  git commit -m 'chore(ci): remove committed CI artifacts from repo'`n  git push origin <branch>"
}

Write-Host "NOTE: This script only removes files from the git index. To purge them from history consider git filter-repo (advanced)."


