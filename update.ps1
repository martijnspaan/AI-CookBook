# AI Cookbook Update Script
# This script builds new Docker images and restarts the Kubernetes deployments

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("api", "web", "all")]
    [string]$Image = "all"
)

Write-Host "Starting AI Cookbook update process..." -ForegroundColor Green
Write-Host "Target image(s): $Image" -ForegroundColor Cyan

# Build new Docker images for localhost environment
if ($Image -eq "all" -or $Image -eq "api") {
    Write-Host "Building API Docker image for localhost..." -ForegroundColor Yellow
    docker build -f API/API.Application/Dockerfile -t ai-cookbook-api:localhost API/

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build API image" -ForegroundColor Red
        exit 1
    }
}

if ($Image -eq "all" -or $Image -eq "web") {
    Write-Host "Building Web Docker image for localhost..." -ForegroundColor Yellow
    docker build -t ai-cookbook-web:localhost Web/

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build Web image" -ForegroundColor Red
        exit 1
    }
}

# Restart deployments to use new images
if ($Image -eq "all" -or $Image -eq "api") {
    Write-Host "Restarting API deployment..." -ForegroundColor Yellow
    kubectl rollout restart deployment/api-deployment -n ai-cookbook

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to restart API deployment" -ForegroundColor Red
        exit 1
    }
}

if ($Image -eq "all" -or $Image -eq "web") {
    Write-Host "Restarting Web deployment..." -ForegroundColor Yellow
    kubectl rollout restart deployment/web-deployment -n ai-cookbook

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to restart Web deployment" -ForegroundColor Red
        exit 1
    }
}

# Wait for rollouts to complete
if ($Image -eq "all" -or $Image -eq "api") {
    Write-Host "Waiting for API rollout to complete..." -ForegroundColor Yellow
    kubectl rollout status deployment/api-deployment -n ai-cookbook

    if ($LASTEXITCODE -ne 0) {
        Write-Host "API rollout failed" -ForegroundColor Red
        exit 1
    }
}

if ($Image -eq "all" -or $Image -eq "web") {
    Write-Host "Waiting for Web rollout to complete..." -ForegroundColor Yellow
    kubectl rollout status deployment/web-deployment -n ai-cookbook

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Web rollout failed" -ForegroundColor Red
        exit 1
    }
}

# Check final pod status
Write-Host "Checking final pod status..." -ForegroundColor Green
kubectl get pods -n ai-cookbook

$updatedServices = @()
if ($Image -eq "all" -or $Image -eq "api") { $updatedServices += "API" }
if ($Image -eq "all" -or $Image -eq "web") { $updatedServices += "Web" }

Write-Host "Update completed successfully for: $($updatedServices -join ', ')" -ForegroundColor Green
Write-Host "Web application: http://localhost:4200" -ForegroundColor Cyan
Write-Host "API endpoints: http://localhost:4200/api" -ForegroundColor Cyan
