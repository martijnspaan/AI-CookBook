# PowerShell script to clean up AI Cookbook from local Kubernetes

Write-Host "Cleaning up AI Cookbook deployment..." -ForegroundColor Yellow

# Delete the namespace (this will delete all resources in the namespace)
kubectl delete namespace ai-cookbook

if ($LASTEXITCODE -eq 0) {
    Write-Host "AI Cookbook deployment cleaned up successfully!" -ForegroundColor Green
} else {
    Write-Host "Cleanup completed (namespace may not have existed)" -ForegroundColor Yellow
}

# Optional: Remove Docker images
$removeImages = Read-Host "Do you want to remove the Docker images? (y/N)"
if ($removeImages -eq "y" -or $removeImages -eq "Y") {
    Write-Host "Removing Docker images..." -ForegroundColor Yellow
    docker rmi ai-cookbook-api:latest
    docker rmi ai-cookbook-web:latest
    Write-Host "Docker images removed!" -ForegroundColor Green
}

Write-Host "Cleanup completed!" -ForegroundColor Green
