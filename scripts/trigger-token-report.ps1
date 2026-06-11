# Trigger token report workflow using gh (preferred) or GitHub REST API (fallback).
# Usage (PowerShell):
#   .\scripts\trigger-token-report.ps1 -Mode live -Days 30
param(
  [ValidateSet('mock','live')]
  [string]$Mode = 'live',
  [int]$Days = 30
)

function Get-RepoSlug {
  # try to parse origin remote
  $url = (git remote get-url origin 2>$null)
  if (-not $url) { return $null }
  if ($url -match '[:/]([^/]+/[^/.]+)(?:\.git)?$') { return $matches[1] }
  return $null
}

if (Get-Command gh -ErrorAction SilentlyContinue) {
  Write-Host "Using gh CLI to trigger workflow (mode=$Mode, days=$Days)"
  gh auth status 2>$null | Out-Null
  gh workflow run token-report.yml --ref main -f mode=$Mode -f days=$Days
  Write-Host "Triggered. Watch progress with: gh run watch"
  exit 0
}

# Fallback to GitHub API using GITHUB_TOKEN env
$token = $env:GITHUB_TOKEN
if (-not $token) {
  Write-Error "GITHUB_TOKEN not found in environment. Install gh CLI or set GITHUB_TOKEN and retry."
  exit 2
}

$repo = Get-RepoSlug
if (-not $repo) {
  Write-Error "Could not determine repo slug from git remote. Please run this script from a git clone or set GITHUB_REPO environment variable (owner/repo)."
  exit 3
}

$body = @{ ref = 'main'; inputs = @{ mode = $Mode; days = [string]$Days } } | ConvertTo-Json -Depth 5
$uri = "https://api.github.com/repos/$repo/actions/workflows/token-report.yml/dispatches"

Write-Host "Dispatching workflow via GitHub API to $repo (mode=$Mode, days=$Days)"
try {
  $resp = Invoke-RestMethod -Uri $uri -Method POST -Headers @{ Authorization = "Bearer $token"; Accept = 'application/vnd.github+json' } -Body $body
n } catch {
  Write-Error "Failed to dispatch workflow: $_"
  exit 4
}
Write-Host "Dispatched. Check Actions → Token report in GitHub or use gh to watch/download artifacts."