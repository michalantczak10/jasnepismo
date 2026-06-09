#!/usr/bin/env bash
# Copy dashboard and provisioning into a running Grafana container or prepare local mount
set -euo pipefail

if [ "$1" = "help" ] || [ "$#" -lt 2 ]; then
  echo "Usage: $0 <GRAFANA_CONTAINER_NAME_OR_HOST> <LOCAL_REPO_PATH>"
  echo "Examples:"
  echo "  $0 grafana /home/user/jasnepismo"
  exit 1
fi

GRAFANA=$1
LOCAL=$2

# If GRAFANA looks like a container name, try docker cp; otherwise copy to local host path
if docker ps --format '{{.Names}}' | grep -q "^${GRAFANA}$"; then
  echo "Detected running container ${GRAFANA} — copying files into container"
  docker exec ${GRAFANA} mkdir -p /var/lib/grafana/dashboards/jasnepismo
  docker cp ${LOCAL}/monitoring/grafana-dashboard.json ${GRAFANA}:/var/lib/grafana/dashboards/jasnepismo/grafana-dashboard.json
  docker cp ${LOCAL}/monitoring/provisioning/dashboards.yaml ${GRAFANA}:/etc/grafana/provisioning/dashboards/dashboards.yaml
  echo "Files copied. Restarting Grafana container to trigger provisioning."
  docker restart ${GRAFANA}
else
  echo "Container ${GRAFANA} not found. Create a local folder for provisioning:"
  mkdir -p ${LOCAL}/monitoring/provisioning && mkdir -p ${LOCAL}/monitoring/dashboards
  echo "Mount ${LOCAL}/monitoring/grafana-dashboard.json -> /var/lib/grafana/dashboards/jasnepismo/grafana-dashboard.json"
  echo "Mount ${LOCAL}/monitoring/provisioning/dashboards.yaml -> /etc/grafana/provisioning/dashboards/dashboards.yaml"
  echo "Then (example):"
  echo "docker run -d -p 3000:3000 -v ${LOCAL}/monitoring/grafana-dashboard.json:/var/lib/grafana/dashboards/jasnepismo/grafana-dashboard.json -v ${LOCAL}/monitoring/provisioning/dashboards.yaml:/etc/grafana/provisioning/dashboards/dashboards.yaml grafana/grafana:latest"
fi
