# PowerShell script to set up Azure resources for AI Cookbook test environment
# Prerequisites: Azure CLI

param(
    [string]$ResourceGroup = "rg-martijn",
    [string]$Location = "West Europe",
    [string]$ContainerRegistryName = "aicookbookmartijn",
    [string]$ApiContainerGroupName = "ai-cookbook-api",
    [string]$WebContainerGroupName = "ai-cookbook-web"
)

Write-Host "Setting up Azure resources for AI Cookbook test environment using Azure Container Instances (ACI)..." -ForegroundColor Green

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

# Check if resource group exists
Write-Host "Checking resource group '$ResourceGroup'..." -ForegroundColor Yellow
$rgExists = az group show --name $ResourceGroup --query "name" -o tsv 2>$null

if (-not $rgExists) {
    Write-Host "Creating resource group '$ResourceGroup'..." -ForegroundColor Yellow
    az group create --name $ResourceGroup --location "$Location"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create resource group"
        exit 1
    }
} else {
    Write-Host "Resource group '$ResourceGroup' already exists" -ForegroundColor Green
}

# Check if Azure Container Registry exists
Write-Host "Checking Azure Container Registry '$ContainerRegistryName'..." -ForegroundColor Yellow
$acrExists = az acr show --name $ContainerRegistryName --resource-group $ResourceGroup --query "name" -o tsv 2>$null

if (-not $acrExists) {
    Write-Host "Creating Azure Container Registry '$ContainerRegistryName'..." -ForegroundColor Yellow
    az acr create --resource-group $ResourceGroup --name $ContainerRegistryName --sku Basic --admin-enabled true
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create Azure Container Registry"
        exit 1
    }
} else {
    Write-Host "Azure Container Registry '$ContainerRegistryName' already exists" -ForegroundColor Green
}

# Get ACR login server
$acrLoginServer = az acr show --name $ContainerRegistryName --resource-group $ResourceGroup --query "loginServer" -o tsv
Write-Host "Container Registry login server: $acrLoginServer" -ForegroundColor Green

# Check if Azure Container Instances exist
Write-Host "Checking Azure Container Instances..." -ForegroundColor Yellow

# Check API Container Group
$apiExists = az container show --resource-group $ResourceGroup --name $ApiContainerGroupName --query "name" -o tsv 2>$null
if ($apiExists) {
    Write-Host "API Container Group '$ApiContainerGroupName' already exists" -ForegroundColor Green
} else {
    Write-Host "API Container Group '$ApiContainerGroupName' not found. You may need to create it manually." -ForegroundColor Yellow
}

# Check Web Container Group
$webExists = az container show --resource-group $ResourceGroup --name $WebContainerGroupName --query "name" -o tsv 2>$null
if ($webExists) {
    Write-Host "Web Container Group '$WebContainerGroupName' already exists" -ForegroundColor Green
} else {
    Write-Host "Web Container Group '$WebContainerGroupName' not found. You may need to create it manually." -ForegroundColor Yellow
}

# Get Container Instance information
if ($apiExists) {
    Write-Host "Getting API Container Instance information..." -ForegroundColor Yellow
    $apiInfo = az container show --resource-group $ResourceGroup --name $ApiContainerGroupName --query "{name:name, ipAddress:ipAddress.ip, fqdn:ipAddress.fqdn, state:containers[0].instanceView.currentState.state}" -o table
    Write-Host "API Container Information:" -ForegroundColor Cyan
    Write-Host $apiInfo
}

if ($webExists) {
    Write-Host "Getting Web Container Instance information..." -ForegroundColor Yellow
    $webInfo = az container show --resource-group $ResourceGroup --name $WebContainerGroupName --query "{name:name, ipAddress:ipAddress.ip, fqdn:ipAddress.fqdn, state:containers[0].instanceView.currentState.state}" -o table
    Write-Host "Web Container Information:" -ForegroundColor Cyan
    Write-Host $webInfo
}

# Get resource information
Write-Host "`nAzure resources setup completed successfully!" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Cyan
Write-Host "API Container Group: $ApiContainerGroupName" -ForegroundColor Cyan
Write-Host "Web Container Group: $WebContainerGroupName" -ForegroundColor Cyan
Write-Host "Container Registry: $acrLoginServer" -ForegroundColor Cyan
Write-Host "Location: $Location" -ForegroundColor Cyan

# Get ACR info
Write-Host "`nContainer Registry Information:" -ForegroundColor Cyan
az acr show --name $ContainerRegistryName --resource-group $ResourceGroup --query "{name:name,loginServer:loginServer,sku:sku,provisioningState:provisioningState}" -o table

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Update the Azure Container Registry name in deploy-test.ps1 if different from '$ContainerRegistryName'" -ForegroundColor White
Write-Host "2. Update the Resource Group name in deploy-test.ps1 if different from '$ResourceGroup'" -ForegroundColor White
Write-Host "3. Run ./deploy-test.ps1 to deploy the application to ACI" -ForegroundColor White
Write-Host "4. Update the CosmosDB connection string in secret-test.yaml with your actual connection string" -ForegroundColor White
Write-Host "5. Update the TLS certificate in tls-secret-test.yaml with your actual certificate" -ForegroundColor White

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
