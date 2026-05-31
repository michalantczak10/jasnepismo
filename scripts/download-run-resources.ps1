param([string]$RunId, [string]$Pat)
if (-not $RunId) { Write-Error 'Provide RunId as first parameter'; exit 1 }
if (-not $Pat) { Write-Error 'Provide PAT as second parameter'; exit 1 }
$repo = 'michalantczak10/jasnepismo'
$apiBase = "https://api.github.com/repos/$repo"

Write-Host "Downloading logs for run $RunId"
$logsUrl = "$apiBase/actions/runs/$RunId/logs"
try {
  curl.exe -L -H "Authorization: token $Pat" -H "Accept: application/vnd.github+json" $logsUrl -o "run-$RunId-logs.zip"
  Write-Host "Saved run-$RunId-logs.zip"
} catch {
  $err = $_
  Write-Host ("Failed to download logs for {0}: {1}" -f $RunId, $err)
}

Write-Host "Listing artifacts for run $RunId"
$artsUrl = "$apiBase/actions/runs/$RunId/artifacts"
try {
  $artsJson = curl.exe -s -H "Authorization: token $Pat" -H "Accept: application/vnd.github+json" $artsUrl | ConvertFrom-Json
  $artsJson | Out-File "artifacts-run-$RunId.json" -Encoding utf8
  if ($artsJson.total_count -gt 0) {
    foreach ($a in $artsJson.artifacts) {
      $out = "artifact-$RunId-$($a.id).zip"
      Write-Host "Downloading artifact $($a.id) -> $out"
      try {
        curl.exe -L -H "Authorization: token $Pat" -H "Accept: application/octet-stream" $($a.archive_download_url) -o $out
        Write-Host "Saved $out"
      } catch {
        Write-Host "Failed to download artifact $($a.id): $_"
      }
    }
  } else {
    Write-Host "No artifacts for run $RunId"
  }
} catch {
  $err = $_
  Write-Host ("Failed to list artifacts for run {0}: {1}" -f $RunId, $err)
}



