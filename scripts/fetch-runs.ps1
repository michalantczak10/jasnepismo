param([string]$Pat)
$repo = 'michalantczak10/jasnepismo'
$api = "https://api.github.com/repos/$repo/actions/runs?per_page=20"
Write-Host "Fetching runs for $repo ..."
$r = curl.exe -s -H "Authorization: token $Pat" -H "Accept: application/vnd.github+json" $api
$r | Out-File runs.json -Encoding utf8
$obj = $r | ConvertFrom-Json
$obj.workflow_runs | Select-Object id,head_branch,head_sha,status,conclusion,run_number,created_at | Sort-Object created_at -Descending | Format-Table -AutoSize
Write-Host "Saved runs.json";

