#!/usr/bin/env bash
set -euo pipefail

# Simple helper to build and deploy the OCR worker to Google Cloud Run.
# Requires gcloud SDK and a configured service account key.

if [ -z "${GCP_PROJECT:-}" ] || [ -z "${GCP_REGION:-}" ] || [ -z "${REDIS_URL:-}" ]; then
  echo "Required env vars: GCP_PROJECT, GCP_REGION, REDIS_URL"
  exit 1
fi

SERVICE_NAME=${SERVICE_NAME:-jasnepismo-worker}
IMAGE=gcr.io/${GCP_PROJECT}/${SERVICE_NAME}:${TAG:-latest}

if [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
  echo "GOOGLE_APPLICATION_CREDENTIALS must point to the service account JSON file"
  exit 1
fi

echo "Building image ${IMAGE}..."
gcloud builds submit --tag "${IMAGE}" .

echo "Deploying ${SERVICE_NAME} to Cloud Run in ${GCP_REGION}..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --region "${GCP_REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "REDIS_URL=${REDIS_URL}" \
  --project "${GCP_PROJECT}"

echo "Deployed ${IMAGE}"
