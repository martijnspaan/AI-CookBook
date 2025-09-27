# PowerShell script to set up Azure resources for AI Cookbook test environment
# Prerequisites: Azure CLI

param(
    [string]$ResourceGroup = "ai-cookbook-rg",
    [string]$Location = "West Europe",
    [string]$AksClusterName = "ai-cookbook-aks",
    [string]$ContainerRegistryName = "ai-cookbook-registry",
    [string]$NodeCount = 2,
    [string]$NodeSize = "Standard_B2s"
)

Write-Host "Setting up Azure resources for AI Cookbook test environment..." -ForegroundColor Green

# Check if Azure CLI is available
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed or not in PATH"
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

# Create resource group
Write-Host "Creating resource group '$ResourceGroup'..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location "$Location"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create resource group"
    exit 1
}

# Create Azure Container Registry
Write-Host "Creating Azure Container Registry '$ContainerRegistryName'..." -ForegroundColor Yellow
az acr create --resource-group $ResourceGroup --name $ContainerRegistryName --sku Basic --admin-enabled true

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create Azure Container Registry"
    exit 1
}

# Get ACR login server
$acrLoginServer = az acr show --name $ContainerRegistryName --resource-group $ResourceGroup --query "loginServer" -o tsv
Write-Host "Container Registry login server: $acrLoginServer" -ForegroundColor Green

# Create AKS cluster
Write-Host "Creating AKS cluster '$AksClusterName'..." -ForegroundColor Yellow
az aks create `
    --resource-group $ResourceGroup `
    --name $AksClusterName `
    --node-count $NodeCount `
    --node-vm-size $NodeSize `
    --enable-addons monitoring `
    --generate-ssh-keys `
    --attach-acr $ContainerRegistryName

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create AKS cluster"
    exit 1
}

# Get AKS credentials
Write-Host "Getting AKS credentials..." -ForegroundColor Yellow
az aks get-credentials --resource-group $ResourceGroup --name $AksClusterName --overwrite-existing

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to get AKS credentials"
    exit 1
}

# Install NGINX Ingress Controller
Write-Host "Installing NGINX Ingress Controller..." -ForegroundColor Yellow
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Failed to install NGINX Ingress Controller. You may need to install it manually."
}

# Wait for ingress controller to be ready
Write-Host "Waiting for NGINX Ingress Controller to be ready..." -ForegroundColor Yellow
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s

# Get cluster information
Write-Host "`nAzure resources created successfully!" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Cyan
Write-Host "AKS Cluster: $AksClusterName" -ForegroundColor Cyan
Write-Host "Container Registry: $acrLoginServer" -ForegroundColor Cyan
Write-Host "Location: $Location" -ForegroundColor Cyan

# Get AKS cluster info
Write-Host "`nAKS Cluster Information:" -ForegroundColor Cyan
az aks show --resource-group $ResourceGroup --name $AksClusterName --query "{name:name,location:location,provisioningState:provisioningState,kubernetesVersion:kubernetesVersion,nodeCount:agentPoolProfiles[0].count}" -o table

# Get ACR info
Write-Host "`nContainer Registry Information:" -ForegroundColor Cyan
az acr show --name $ContainerRegistryName --resource-group $ResourceGroup --query "{name:name,loginServer:loginServer,sku:sku,provisioningState:provisioningState}" -o table

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Update the Azure Container Registry name in deploy-test.ps1 if different from '$ContainerRegistryName'" -ForegroundColor White
Write-Host "2. Update the Resource Group and AKS Cluster name in deploy-test.ps1 if different" -ForegroundColor White
Write-Host "3. Run ./deploy-test.ps1 to deploy the application" -ForegroundColor White
Write-Host "4. Update the CosmosDB connection string in secret-test.yaml with your actual connection string" -ForegroundColor White
Write-Host "5. Update the TLS certificate in tls-secret-test.yaml with your actual certificate" -ForegroundColor White

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
