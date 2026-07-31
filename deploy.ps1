$ErrorActionPreference = "Stop"
$VPS = "peakflow-vps"
$ROOT = $PSScriptRoot
$OWNER = "rakibj"
$REGISTRY = "ghcr.io/$OWNER"

Write-Host "Building builder..." -ForegroundColor Cyan
docker build --build-arg SCOPE=builder -t "$REGISTRY/peakflow-builder:latest" $ROOT
if (-not $?) { exit 1 }

Write-Host "Building viewer..." -ForegroundColor Cyan
docker build --build-arg SCOPE=viewer -t "$REGISTRY/peakflow-viewer:latest" $ROOT
if (-not $?) { exit 1 }

Write-Host "Pushing builder to GHCR..." -ForegroundColor Cyan
docker push "$REGISTRY/peakflow-builder:latest"
if (-not $?) { exit 1 }

Write-Host "Pushing viewer to GHCR..." -ForegroundColor Cyan
docker push "$REGISTRY/peakflow-viewer:latest"
if (-not $?) { exit 1 }

Write-Host "Deploying on VPS..." -ForegroundColor Cyan
scp "$ROOT/docker-compose.prod.yml" "${VPS}:/home/apps/peakflow/docker-compose.yml"
if (-not $?) { exit 1 }
ssh $VPS "docker pull $REGISTRY/peakflow-builder:latest && docker pull $REGISTRY/peakflow-viewer:latest"
if (-not $?) { exit 1 }
ssh $VPS "cd /home/apps/peakflow && docker compose up -d --no-build --force-recreate builder viewer"
if (-not $?) { exit 1 }

Write-Host "Verifying..." -ForegroundColor Cyan
ssh $VPS "docker inspect $REGISTRY/peakflow-builder:latest | grep Created"

Write-Host "Done. Builder: http://157.173.120.4:3100  Viewer: http://157.173.120.4:3101" -ForegroundColor Green
