# Deploy to Cloud Run WITHOUT local Docker (uses Cloud Build).
# Usage:
#   .\deploy-cloudrun.ps1
#   .\deploy-cloudrun.ps1 -ProjectId my-project -Region asia-southeast1 -Service manam-rebrand-mock
# Prereqs: gcloud CLI logged in (gcloud auth login), billing enabled.

param(
  [string]$ProjectId = "",
  [string]$Region = "asia-southeast1",
  [string]$Service = "manam-rebrand-mock",
  [string]$Repo = "manam-apps",
  [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectId)) {
  $ProjectId = (gcloud config get-value project 2>$null).Trim()
}
if ([string]::IsNullOrWhiteSpace($ProjectId) -or $ProjectId -eq "(unset)") {
  Write-Error "No project set. Pass -ProjectId <id> or run: gcloud config set project <id>"
  exit 1
}

$Image = "$Region-docker.pkg.dev/$ProjectId/$Repo/$Service`:$Tag"

Write-Host "Project : $ProjectId"
Write-Host "Region  : $Region"
Write-Host "Service : $Service"
Write-Host "Image   : $Image"

# 1. Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project=$ProjectId

# 2. Create Artifact Registry repo (idempotent)
$existing = gcloud artifacts repositories describe $Repo --location=$Region --project=$ProjectId 2>$null
if (-not $?) {
  gcloud artifacts repositories create $Repo --repository-format=docker --location=$Region --project=$ProjectId --description="Docker images for Manam apps"
} else {
  Write-Host "Artifact Registry repo '$Repo' already exists."
}

# 3. Remote build — no local Docker daemon needed
gcloud builds submit --tag $Image --project=$ProjectId .

# 4. Deploy to Cloud Run
gcloud run deploy $Service `
  --image $Image `
  --project=$ProjectId `
  --region=$Region `
  --platform=managed `
  --allow-unauthenticated `
  --port=8080 `
  --memory=1Gi `
  --cpu=1 `
  --min-instances=0 `
  --max-instances=10

Write-Host ""
Write-Host "Done. URL:"
gcloud run services describe $Service --project=$ProjectId --region=$Region --format="value(status.url)"
