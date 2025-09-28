# AI Cookbook Test Environment Update Script
# This script builds new Docker images, pushes them to Azure Container Registry, and restarts the Kubernetes deployments in the test environment
#
# Usage:
#   .\update-test.ps1                    # Update both API and Web
#   .\update-test.ps1 -Image api         # Update only API
#   .\update-test.ps1 -Image web         # Update only Web
#   .\update-test.ps1 -ImageTag "1.0.1"  # Use custom image tag
#
# Prerequisites:
#   - Azure CLI logged in (az login)
#   - kubectl configured for AKS cluster
#   - Docker running locally
#   - Access to Azure Container Registry

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("api", "web", "all")]
    [string]$Image = "all",
    [string]$AzureContainerRegistry = "aicookbookregistry.azurecr.io",
    [string]$ImageTag = "",
    [string]$ResourceGroup = "AI-CookBook",
    [string]$AksClusterName = "k8s-ai-cookbook"
)

# Generate timestamp-based tag if not provided
if ([string]::IsNullOrEmpty($ImageTag)) {
    $ImageTag = "test-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}

Write-Host "Starting AI Cookbook test environment update process..." -ForegroundColor Green
Write-Host "Target image(s): $Image" -ForegroundColor Cyan
Write-Host "Azure Container Registry: $AzureContainerRegistry" -ForegroundColor Cyan
Write-Host "Image tag: $ImageTag" -ForegroundColor Cyan

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

# Azure authentication and setup
Write-Host "Performing Azure setup..." -ForegroundColor Yellow

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

# Build and push Docker images
if ($Image -eq "all" -or $Image -eq "api") {
    Write-Host "Building API Docker image..." -ForegroundColor Yellow
    docker build -t $AzureContainerRegistry/ai-cookbook-api:$ImageTag -f API/API.Application/Dockerfile API/

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build API image" -ForegroundColor Red
        exit 1
    }

    Write-Host "Pushing API image to Azure Container Registry..." -ForegroundColor Yellow
    docker push $AzureContainerRegistry/ai-cookbook-api:$ImageTag

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to push API image" -ForegroundColor Red
        exit 1
    }
}

if ($Image -eq "all" -or $Image -eq "web") {
    Write-Host "Building Web Docker image..." -ForegroundColor Yellow
    docker build -t $AzureContainerRegistry/ai-cookbook-web:$ImageTag -f Web/Dockerfile Web/

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build Web image" -ForegroundColor Red
        exit 1
    }

    Write-Host "Pushing Web image to Azure Container Registry..." -ForegroundColor Yellow
    docker push $AzureContainerRegistry/ai-cookbook-web:$ImageTag

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to push Web image" -ForegroundColor Red
        exit 1
    }
}

# Update deployment images using kubectl set image (no file modification needed)
Write-Host "Updating deployment images..." -ForegroundColor Yellow

if ($Image -eq "all" -or $Image -eq "api") {
    Write-Host "Updating API deployment image..." -ForegroundColor Yellow
    kubectl set image deployment/api-deployment-test api=$AzureContainerRegistry/ai-cookbook-api:$ImageTag -n ai-cookbook-test

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to update API deployment image" -ForegroundColor Red
        exit 1
    }
    Write-Host "Updated API deployment image reference" -ForegroundColor Green
}

if ($Image -eq "all" -or $Image -eq "web") {
    Write-Host "Updating Web deployment image..." -ForegroundColor Yellow
    kubectl set image deployment/web-deployment-test web=$AzureContainerRegistry/ai-cookbook-web:$ImageTag -n ai-cookbook-test

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to update Web deployment image" -ForegroundColor Red
        exit 1
    }
    Write-Host "Updated Web deployment image reference" -ForegroundColor Green
}

# Wait for rollouts to complete
if ($Image -eq "all" -or $Image -eq "api") {
    Write-Host "Waiting for API rollout to complete..." -ForegroundColor Yellow
    kubectl rollout status deployment/api-deployment-test -n ai-cookbook-test

    if ($LASTEXITCODE -ne 0) {
        Write-Host "API rollout failed" -ForegroundColor Red
        exit 1
    }
}

if ($Image -eq "all" -or $Image -eq "web") {
    Write-Host "Waiting for Web rollout to complete..." -ForegroundColor Yellow
    kubectl rollout status deployment/web-deployment-test -n ai-cookbook-test

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Web rollout failed" -ForegroundColor Red
        exit 1
    }
}

# Check final pod status
Write-Host "Checking final pod status..." -ForegroundColor Green
kubectl get pods -n ai-cookbook-test

$updatedServices = @()
if ($Image -eq "all" -or $Image -eq "api") { $updatedServices += "API" }
if ($Image -eq "all" -or $Image -eq "web") { $updatedServices += "Web" }

Write-Host "Update completed successfully for: $($updatedServices -join ', ')" -ForegroundColor Green
Write-Host "Test environment: https://ai-cookbook-test.westeurope.cloudapp.azure.com" -ForegroundColor Cyan
Write-Host "API endpoints: https://ai-cookbook-test.westeurope.cloudapp.azure.com/api" -ForegroundColor Cyan
Write-Host "API Swagger: https://ai-cookbook-test.westeurope.cloudapp.azure.com/api/swagger" -ForegroundColor Cyan
