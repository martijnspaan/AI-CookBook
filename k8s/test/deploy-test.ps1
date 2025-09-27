# PowerShell script to deploy AI Cookbook to Azure Kubernetes test environment
# Prerequisites: Azure CLI, kubectl, Docker, Azure Container Registry access

param(
    [string]$AzureContainerRegistry = "aicookbookregistry.azurecr.io",
    [string]$ImageTag = "1.0.0-test",
    [string]$ResourceGroup = "AI-CookBook",
    [string]$AksClusterName = "k8s-ai-cookbook",
    [switch]$SkipImageBuild = $false,
    [switch]$SkipImagePush = $false
)

Write-Host "Starting AI Cookbook test environment deployment to Azure Kubernetes..." -ForegroundColor Green

# Check if required tools are available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed or not in PATH"
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH"
    exit 1
}

# Check if logged into Azure
Write-Host "Checking Azure authentication..." -ForegroundColor Yellow
$azAccount = az account show --query "name" -o tsv 2>$null
if (-not $azAccount) {
    Write-Error "Not logged into Azure. Please run 'az login' first."
    exit 1
}
Write-Host "Logged into Azure as: $azAccount" -ForegroundColor Green

# Get AKS credentials
Write-Host "Getting AKS credentials..." -ForegroundColor Yellow
az aks get-credentials --resource-group $ResourceGroup --name $AksClusterName --overwrite-existing

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to get AKS credentials. Please check your resource group and cluster name."
    exit 1
}

# Login to Azure Container Registry
Write-Host "Logging into Azure Container Registry..." -ForegroundColor Yellow
az acr login --name $AzureContainerRegistry.Split('.')[0]

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to login to Azure Container Registry. Please check your registry name and permissions."
    exit 1
}

# Build and push Docker images if not skipped
if (-not $SkipImageBuild) {
    Write-Host "Building and pushing Docker images..." -ForegroundColor Yellow

    # Change to project root directory
    $originalLocation = Get-Location
    Set-Location ../..

    # Build API image
    Write-Host "Building API image..." -ForegroundColor Cyan
    docker build -t $AzureContainerRegistry/ai-cookbook-api:$ImageTag -f API/API.Application/Dockerfile API/

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build API image"
        Set-Location $originalLocation
        exit 1
    }

    # Build Web image
    Write-Host "Building Web image..." -ForegroundColor Cyan
    docker build -t $AzureContainerRegistry/ai-cookbook-web:$ImageTag -f Web/Dockerfile Web/

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build Web image"
        Set-Location $originalLocation
        exit 1
    }

    # Return to k8s/test directory
    Set-Location $originalLocation

    Write-Host "Docker images built successfully!" -ForegroundColor Green
}

if (-not $SkipImagePush) {
    Write-Host "Pushing images to Azure Container Registry..." -ForegroundColor Yellow

    # Push API image
    Write-Host "Pushing API image..." -ForegroundColor Cyan
    docker push $AzureContainerRegistry/ai-cookbook-api:$ImageTag

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push API image"
        exit 1
    }

    # Push Web image
    Write-Host "Pushing Web image..." -ForegroundColor Cyan
    docker push $AzureContainerRegistry/ai-cookbook-web:$ImageTag

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push Web image"
        exit 1
    }

    Write-Host "Images pushed successfully!" -ForegroundColor Green
}

# Update image references in deployment files
Write-Host "Updating image references in deployment files..." -ForegroundColor Yellow

# Update API deployment
$apiDeploymentContent = Get-Content "api-deployment-test.yaml" -Raw
$apiDeploymentContent = $apiDeploymentContent -replace "ai-cookbook-api:1.0.0-test", "$AzureContainerRegistry/ai-cookbook-api:$ImageTag"
Set-Content "api-deployment-test.yaml" -Value $apiDeploymentContent

# Update Web deployment
$webDeploymentContent = Get-Content "web-deployment-test.yaml" -Raw
$webDeploymentContent = $webDeploymentContent -replace "ai-cookbook-web:1.0.0-test", "$AzureContainerRegistry/ai-cookbook-web:$ImageTag"
Set-Content "web-deployment-test.yaml" -Value $webDeploymentContent

# Apply Kubernetes manifests
Write-Host "Applying Kubernetes manifests..." -ForegroundColor Yellow

# Create namespace
kubectl apply -f namespace-test.yaml

# Apply RBAC
kubectl apply -f rbac-test.yaml

# Apply ConfigMap
kubectl apply -f configmap-test.yaml

# Apply Secret (you may need to update the connection string)
kubectl apply -f secret-test.yaml

# Apply TLS Secret (you may need to update the certificate)
kubectl apply -f tls-secret-test.yaml

# Apply API resources
kubectl apply -f api-deployment-test.yaml
kubectl apply -f api-service-test.yaml

# Apply Web resources
kubectl apply -f web-deployment-test.yaml
kubectl apply -f web-service-test.yaml

# Apply Pod Disruption Budgets
kubectl apply -f pod-disruption-budget-test.yaml

# Apply Network Policy
kubectl apply -f network-policy-test.yaml

# Apply Ingress
kubectl apply -f ingress-test.yaml

Write-Host "Kubernetes manifests applied successfully!" -ForegroundColor Green

# Wait for deployments to be ready
Write-Host "Waiting for deployments to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/api-deployment-test -n ai-cookbook-test
kubectl wait --for=condition=available --timeout=300s deployment/web-deployment-test -n ai-cookbook-test

# Get service information
Write-Host "Deployment completed! Service information:" -ForegroundColor Green
kubectl get services -n ai-cookbook-test
kubectl get pods -n ai-cookbook-test
kubectl get ingress -n ai-cookbook-test

Write-Host "`nTo access the application:" -ForegroundColor Cyan
Write-Host "Test environment: https://ai-cookbook-test.westeurope.cloudapp.azure.com" -ForegroundColor White
Write-Host "API: https://ai-cookbook-test.westeurope.cloudapp.azure.com/api" -ForegroundColor White
Write-Host "API Swagger: https://ai-cookbook-test.westeurope.cloudapp.azure.com/api/swagger" -ForegroundColor White
Write-Host "Alternative URL: https://k8s-ai-cookbook-dns-e3byex43.hcp.westeurope.azmk8s.io" -ForegroundColor White

Write-Host "`nTo check logs:" -ForegroundColor Cyan
Write-Host "API logs: kubectl logs -f deployment/api-deployment-test -n ai-cookbook-test" -ForegroundColor White
Write-Host "Web logs: kubectl logs -f deployment/web-deployment-test -n ai-cookbook-test" -ForegroundColor White

Write-Host "`nTo delete the deployment:" -ForegroundColor Cyan
Write-Host "kubectl delete namespace ai-cookbook-test" -ForegroundColor White

Write-Host "`nTest environment deployment completed successfully!" -ForegroundColor Green
