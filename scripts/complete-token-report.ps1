param(
  [ValidateSet('mock','live')]
  [string]$Mode = 'live',
  [int]$Days = 30,
  [string]$Ref = 'main',
  [string]$Workflow = 'token-report.yml',
  [int]$TimeoutSeconds = 1800
)

$OutDir = Join-Path -Path (Get-Location) -ChildPath 'monitoring\reports'

function Require-Gh {
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "gh CLI not found. Install GitHub CLI and run 'gh auth login'."
    exit 2
  }
}

Require-Gh

Write-Host "Dispatching workflow $Workflow (mode=$Mode days=$Days ref=$Ref)..."
gh workflow run $Workflow --ref $Ref -f mode=$Mode -f days=$Days | Out-Null
Start-Sleep -Seconds 3

# get latest run id
$run = gh run list --workflow $Workflow --branch $Ref --limit 1 --json id,status --jq '.[0]'
if (-not $run) {
  Write-Error "Could not determine run id. Inspect with 'gh run list --workflow $Workflow'."
  exit 3
}
$runId = (ConvertFrom-Json $run).id
Write-Host "Run ID: $runId"

Write-Host "Watching run until completion (timeout ${TimeoutSeconds}s)..."
$watchStart = Get-Date
$proc = Start-Process -FilePath gh -ArgumentList @('run','watch',$runId) -NoNewWindow -PassThru -Wait -ErrorAction SilentlyContinue

# gh run watch returns when finished; double-check status
$end = Get-Date
if (($end - $watchStart).TotalSeconds -ge $TimeoutSeconds) {
  Write-Error "Timeout waiting for workflow to finish after $TimeoutSeconds seconds."
  exit 4
}

# Download artifacts
if (-not (Test-Path $OutDir)) { New-Item -Path $OutDir -ItemType Directory -Force | Out-Null }
Write-Host "Downloading artifacts to $OutDir..."
gh run download $runId -D $OutDir

Write-Host "Running aggregation and summary locally..."
node scripts\aggregate-reports.js --days $Days
node scripts\report-summary.js --days $Days

Write-Host "Automation complete. See files in $OutDir."
exit 0
