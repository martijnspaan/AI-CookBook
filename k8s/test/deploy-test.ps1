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

# Apply Kubernetes manifests with best practices
Write-Host "Applying Kubernetes manifests with best practices..." -ForegroundColor Yellow

# 1. Security and Resource Management
Write-Host "Applying security and resource management..." -ForegroundColor Cyan
kubectl apply -f pod-security-test.yaml
kubectl apply -f resource-quotas-test.yaml

# 2. RBAC and Configuration
Write-Host "Applying RBAC and configuration..." -ForegroundColor Cyan
kubectl apply -f rbac-test.yaml
kubectl apply -f configmap-test.yaml
kubectl apply -f secret-test.yaml
kubectl apply -f tls-secret-test.yaml

# 3. Application Deployments
Write-Host "Applying application deployments..." -ForegroundColor Cyan
kubectl apply -f api-deployment-test.yaml
kubectl apply -f web-deployment-test.yaml
kubectl apply -f api-service-test.yaml
kubectl apply -f web-service-test.yaml

# 4. High Availability and Scaling
Write-Host "Applying high availability and scaling..." -ForegroundColor Cyan
kubectl apply -f pod-disruption-budget-test.yaml
kubectl apply -f hpa-test.yaml

# 5. Network and Ingress
Write-Host "Applying network policies and ingress..." -ForegroundColor Cyan
kubectl apply -f network-policy-test.yaml
kubectl apply -f ingress-test.yaml

# 6. Monitoring and Operations (Optional - requires Prometheus operator)
Write-Host "Applying monitoring and operational tools..." -ForegroundColor Cyan
try {
    kubectl apply -f monitoring-test.yaml
    Write-Host "Monitoring configuration applied successfully" -ForegroundColor Green
} catch {
    Write-Warning "Monitoring configuration skipped (Prometheus operator may not be installed)"
}

try {
    kubectl apply -f backup-test.yaml
    Write-Host "Backup configuration applied successfully" -ForegroundColor Green
} catch {
    Write-Warning "Backup configuration skipped (may require additional setup)"
}

Write-Host "Kubernetes manifests applied successfully!" -ForegroundColor Green

# Wait for deployments to be ready
Write-Host "Waiting for deployments to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/api-deployment-test -n ai-cookbook-test
kubectl wait --for=condition=available --timeout=300s deployment/web-deployment-test -n ai-cookbook-test

# Get service information
Write-Host "Deployment completed! Service information:" -ForegroundColor Green

Write-Host "`n=== Pods ===" -ForegroundColor Yellow
kubectl get pods -n ai-cookbook-test -o wide

Write-Host "`n=== Services ===" -ForegroundColor Yellow
kubectl get services -n ai-cookbook-test

Write-Host "`n=== Ingress ===" -ForegroundColor Yellow
kubectl get ingress -n ai-cookbook-test

Write-Host "`n=== Horizontal Pod Autoscalers ===" -ForegroundColor Yellow
kubectl get hpa -n ai-cookbook-test

Write-Host "`n=== Pod Disruption Budgets ===" -ForegroundColor Yellow
kubectl get pdb -n ai-cookbook-test

Write-Host "`n=== Network Policies ===" -ForegroundColor Yellow
kubectl get networkpolicies -n ai-cookbook-test

Write-Host "`n=== Resource Quotas ===" -ForegroundColor Yellow
kubectl describe resourcequota -n ai-cookbook-test

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
