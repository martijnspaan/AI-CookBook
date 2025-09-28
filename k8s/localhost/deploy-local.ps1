# PowerShell script to deploy AI Cookbook to local Kubernetes
# Prerequisites: Docker Desktop with Kubernetes enabled, kubectl

Write-Host "Starting AI Cookbook local deployment..." -ForegroundColor Green

# Check if kubectl is available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

# Check if Docker is running
if (-not (Get-Process "Docker Desktop" -ErrorAction SilentlyContinue)) {
    Write-Error "Docker Desktop is not running. Please start Docker Desktop first."
    exit 1
}

# Build Docker images
Write-Host "Building Docker images..." -ForegroundColor Yellow

# Change to project root directory
$originalLocation = Get-Location
Set-Location ..

# Build API image
Write-Host "Building API image..."
docker build -t ai-cookbook-api:latest -f API/API.Application/Dockerfile API/

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build API image"
    Set-Location $originalLocation
    exit 1
}

# Build Web image
Write-Host "Building Web image..."
docker build -t ai-cookbook-web:latest -f Web/Dockerfile Web/

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build Web image"
    Set-Location $originalLocation
    exit 1
}

# Return to k8s directory
Set-Location $originalLocation

Write-Host "Docker images built successfully!" -ForegroundColor Green

# Apply Kubernetes manifests
Write-Host "Applying Kubernetes manifests..." -ForegroundColor Yellow

# Create namespace
kubectl apply -f namespace.yaml

# Apply ConfigMap
kubectl apply -f configmap.yaml

# Apply Secret (you may need to update the connection string)
kubectl apply -f secret.yaml

# Apply API resources
kubectl apply -f api-deployment.yaml
kubectl apply -f api-service.yaml

# Apply Web resources
kubectl apply -f web-deployment.yaml
kubectl apply -f web-service.yaml

# Apply Ingress
kubectl apply -f ingress.yaml

Write-Host "Kubernetes manifests applied successfully!" -ForegroundColor Green

# Wait for deployments to be ready
Write-Host "Waiting for deployments to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/api-deployment -n ai-cookbook
kubectl wait --for=condition=available --timeout=300s deployment/web-deployment -n ai-cookbook

# Get service information
Write-Host "Deployment completed! Service information:" -ForegroundColor Green
kubectl get services -n ai-cookbook
kubectl get pods -n ai-cookbook

Write-Host "`nTo access the application:" -ForegroundColor Cyan
Write-Host "Web application: http://localhost:4200" -ForegroundColor White
Write-Host "API: http://localhost:4201" -ForegroundColor White
Write-Host "API Swagger: http://localhost:4201/swagger" -ForegroundColor White

Write-Host "`nTo check logs:" -ForegroundColor Cyan
Write-Host "API logs: kubectl logs -f deployment/api-deployment -n ai-cookbook" -ForegroundColor White
Write-Host "Web logs: kubectl logs -f deployment/web-deployment -n ai-cookbook" -ForegroundColor White

Write-Host "`nTo delete the deployment:" -ForegroundColor Cyan
Write-Host "kubectl delete namespace ai-cookbook" -ForegroundColor White
