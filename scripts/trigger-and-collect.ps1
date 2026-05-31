param(
  [string]$Pat = $env:GITHUB_PAT,
  [string]$Workflow = ".github/workflows/update-baseline.yml",
  [string]$Ref = "main",
  [int]$PollSeconds = 5,
  [int]$TimeoutSeconds = 900
)

if (-not $Pat) {
  # Prompt securely for PAT if not provided
  $sec = Read-Host -AsSecureString "Enter GITHUB PAT (input hidden)"
  $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { $Pat = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

if (-not $Pat) { Write-Error "Provide PAT as -Pat parameter or set GITHUB_PAT environment variable"; exit 1 }

$repo = 'michalantczak10/jasnepismo'
$apiBase = "https://api.github.com/repos/$repo"
$workflowEsc = $Workflow -replace '\\','/'

Write-Host "Triggering workflow '$Workflow' on ref '$Ref' for repo $repo..."
$dispatchUrl = "$apiBase/actions/workflows/$workflowEsc/dispatches"
$payload = @{ ref = $Ref } | ConvertTo-Json -Depth 4
$hAuth = "Authorization: token $Pat"

# trigger dispatch
$resp = curl.exe -s -w "`n%{http_code}" -X POST -H $hAuth -H "Accept: application/vnd.github+json" -H "Content-Type: application/json" -d $payload $dispatchUrl
$lines = $resp -split "`n"
$http = $lines[-1]
if ($http -eq '204') {
  Write-Host "Workflow dispatched (HTTP 204)"
} else {
  Write-Host "Dispatch response (http $http):`n$resp"
  Write-Error "Failed to dispatch workflow. Aborting."; exit 2
}

# find the new run for this workflow (created recently)
$startTime = Get-Date
$runId = $null
$maxAgeSec = 300

Write-Host "Looking for new run (waiting up to $TimeoutSeconds seconds)..."
while (((Get-Date) - $startTime).TotalSeconds -lt $TimeoutSeconds) {
  Start-Sleep -Seconds $PollSeconds
  $listUrl = "$apiBase/actions/workflows/$workflowEsc/runs?per_page=6"
  $runsJson = curl.exe -s -H $hAuth -H "Accept: application/vnd.github+json" $listUrl
  try {
    $obj = $runsJson | ConvertFrom-Json
  } catch {
    Write-Host "Failed to parse runs JSON; raw response:`n$runsJson"
    continue
  }
  if ($obj.workflow_runs -and $obj.workflow_runs.Count -gt 0) {
    foreach ($r in $obj.workflow_runs) {
      try {
        $created = [DateTime]::Parse($r.created_at)
      } catch {
        continue
      }
      $age = (New-TimeSpan -Start $created -End (Get-Date)).TotalSeconds
      if ($age -lt $maxAgeSec) {
        $runId = $r.id
        break
      }
    }
    if ($runId) { break }
  }
}

if (-not $runId) {
  Write-Error "Could not find a recent run for workflow $Workflow within timeout."; exit 3
}
Write-Host "Found run id: $runId"

# Poll run status until completed
$runUrl = "$apiBase/actions/runs/$runId"
while (((Get-Date) - $startTime).TotalSeconds -lt $TimeoutSeconds) {
  $runJson = curl.exe -s -H $hAuth -H "Accept: application/vnd.github+json" $runUrl
  try { $runObj = $runJson | ConvertFrom-Json } catch { Write-Host "Failed to parse run JSON: $runJson"; Start-Sleep -Seconds $PollSeconds; continue }
  $status = $runObj.status
  $conclusion = $runObj.conclusion
  Write-Host "[$(Get-Date -Format o)] status=$status conclusion=$conclusion"
  if ($status -eq 'completed') { break }
  Start-Sleep -Seconds $PollSeconds
}

if ($runObj.status -ne 'completed') { Write-Error "Run did not complete in time"; exit 4 }
Write-Host "Run completed with conclusion: $($runObj.conclusion)"

# Download logs and artifacts using existing helper script
$downloadScript = Join-Path -Path $PSScriptRoot -ChildPath 'download-run-resources.ps1'
if (Test-Path $downloadScript) {
  Write-Host "Invoking $downloadScript $runId <PAT> to download logs and artifacts..."
  & $downloadScript $runId $Pat
} else {
  Write-Warning "Helper download script not found at $downloadScript; skipping artifact download"
}

# Extract any downloaded artifact zip files into a folder for inspection
$cwd = Get-Location
$artifactZips = Get-ChildItem -Path $cwd -Filter "artifact-$runId-*.zip" -ErrorAction SilentlyContinue
$logZip = Get-ChildItem -Path $cwd -Filter "run-$runId-logs.zip" -ErrorAction SilentlyContinue
$extractRoot = Join-Path $cwd ("run-$runId-artifacts")
if ($artifactZips) {
  New-Item -ItemType Directory -Path $extractRoot -Force | Out-Null
  foreach ($z in $artifactZips) {
    $dest = Join-Path $extractRoot ($z.BaseName)
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    try {
      Expand-Archive -Path $z.FullName -DestinationPath $dest -Force
      Write-Host "Extracted $($z.Name) -> $dest"
    } catch {
      Write-Warning "Failed to extract $($z.Name): $_"
    }
  }
} else { Write-Host "No artifact zip files found for run $runId" }

if ($logZip) {
  $logDest = Join-Path $cwd ("run-$runId-logs")
  try { Expand-Archive -Path $logZip.FullName -DestinationPath $logDest -Force; Write-Host "Extracted logs to $logDest" } catch { Write-Warning "Failed to extract logs zip: $_" }
}

# Search for compare-summary.json and compare.log in extracted artifacts and print their paths
$found = Get-ChildItem -Path $extractRoot -Recurse -Include "compare-summary.json","compare.log" -ErrorAction SilentlyContinue
if ($found) {
  foreach ($f in $found) {
    Write-Host "Found: $($f.FullName)"
  }
} else {
  Write-Host "No compare-summary.json or compare.log found in artifacts. Check generator logs or run artifacts manually."
}

Write-Host "Done. Files saved in: $cwd"

