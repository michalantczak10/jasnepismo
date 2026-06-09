param(
  [string]$GrafanaContainerOrHost = "",
  [string]$LocalRepo = ""
)

if (-not $GrafanaContainerOrHost -or -not $LocalRepo) {
  Write-Output "Usage: .\copy-dashboard.ps1 <GrafanaContainerNameOrHost> <LocalRepoPath>"
  exit 1
}

$container = $GrafanaContainerOrHost
$local = $LocalRepo

# Try docker container copy
$containers = docker ps --format '{{.Names}}' 2>$null
if ($containers -match "^$container$") {
  docker exec $container mkdir -p /var/lib/grafana/dashboards/jasnepismo
  docker cp "$local\monitoring\grafana-dashboard.json" "$container:/var/lib/grafana/dashboards/jasnepismo/grafana-dashboard.json"
  docker cp "$local\monitoring\provisioning\dashboards.yaml" "$container:/etc/grafana/provisioning/dashboards/dashboards.yaml"
  docker restart $container
  Write-Output "Files copied and Grafana restarted"
} else {
  Write-Output "Container not found. Prepare mounts as in README"
}
