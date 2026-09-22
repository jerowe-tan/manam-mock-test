#!/usr/bin/env bash
# Deploy to Cloud Run WITHOUT local Docker (uses Cloud Build).
# Usage (Cloud Shell or any machine with gcloud, no docker needed):
#   chmod +x deploy-cloudrun.sh
#   ./deploy-cloudrun.sh
#   PROJECT_ID=my-project REGION=asia-southeast1 SERVICE=manam-rebrand-mock ./deploy-cloudrun.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-asia-southeast1}"
SERVICE="${SERVICE:-manam-rebrand-mock}"
REPO="${REPO:-manam-apps}"
TAG="${TAG:-latest}"

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
  echo "No project set. Export PROJECT_ID=<id> or run: gcloud config set project <id>" >&2
  exit 1
fi

IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE:$TAG"

echo "Project : $PROJECT_ID"
echo "Region  : $REGION"
echo "Service : $SERVICE"
echo "Image   : $IMAGE"

# 1. Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project="$PROJECT_ID"

# 2. Create Artifact Registry repo (idempotent)
if ! gcloud artifacts repositories describe "$REPO" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION" --project="$PROJECT_ID" --description="Docker images for Manam apps"
else
  echo "Artifact Registry repo '$REPO' already exists."
fi

# 3. Remote build — no local Docker daemon needed
gcloud builds submit --tag "$IMAGE" --project="$PROJECT_ID" .

# 4. Deploy to Cloud Run
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10

echo ""
echo "Done. URL:"
gcloud run services describe "$SERVICE" --project="$PROJECT_ID" --region="$REGION" --format="value(status.url)"
