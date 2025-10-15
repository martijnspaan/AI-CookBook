# Simplified PowerShell script to set up AI Cookbook on Azure Container Instances
# This script uses a simpler approach with public IPs for easier setup

param(
    [string]$ResourceGroup = "rg-martijn",
    [string]$Location = "West Europe",
    [string]$SubscriptionName = "XPRTZ Playground",
    [string]$AzureContainerRegistry = "aicookbookmartijn.azurecr.io",
    [string]$ImageTag = "1.0.0-test",
    [string]$Email = "admin@example.com",
    [switch]$SkipImageBuild = $false,
    [switch]$SkipImagePush = $false
)

Write-Host "Setting up AI Cookbook on Azure Container Instances (Simple)" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow
Write-Host "Container Registry: $AzureContainerRegistry" -ForegroundColor Yellow
Write-Host "Image Tag: $ImageTag" -ForegroundColor Yellow

# Check if required tools are available
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

# Set the correct subscription
if ($azAccount -ne $SubscriptionName) {
    Write-Host "Switching to subscription: $SubscriptionName" -ForegroundColor Yellow
    az account set --subscription "$SubscriptionName"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to switch to subscription: $SubscriptionName"
        exit 1
    }
}

# Step 1: Build and push images if needed
if (-not $SkipImageBuild -or -not $SkipImagePush) {
    Write-Host "`n=== Step 1: Building and Pushing Images ===" -ForegroundColor Green
    
    # Change to project root
    $originalLocation = Get-Location
    Set-Location ".."
    
    # Build and push API image
    if (-not $SkipImageBuild) {
        Write-Host "Building API image..." -ForegroundColor Yellow
        docker build -f API/API.Application/Dockerfile -t "$AzureContainerRegistry/ai-cookbook-api:$ImageTag" API/
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to build API image"
            Set-Location $originalLocation
            exit 1
        }
    }
    
    if (-not $SkipImagePush) {
        Write-Host "Pushing API image..." -ForegroundColor Yellow
        docker push "$AzureContainerRegistry/ai-cookbook-api:$ImageTag"
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to push API image"
            Set-Location $originalLocation
            exit 1
        }
    }
    
    # Build and push Web image
    if (-not $SkipImageBuild) {
        Write-Host "Building Web image..." -ForegroundColor Yellow
        docker build -f Web/Dockerfile -t "$AzureContainerRegistry/ai-cookbook-web:$ImageTag" Web/
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to build Web image"
            Set-Location $originalLocation
            exit 1
        }
    }
    
    if (-not $SkipImagePush) {
        Write-Host "Pushing Web image..." -ForegroundColor Yellow
        docker push "$AzureContainerRegistry/ai-cookbook-web:$ImageTag"
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to push Web image"
            Set-Location $originalLocation
            exit 1
        }
    }
    
    Set-Location $originalLocation
    Write-Host "Images built and pushed successfully!" -ForegroundColor Green
}

# Step 2: Create resource group if it doesn't exist
Write-Host "`n=== Step 2: Setting up Resource Group ===" -ForegroundColor Green

$rgExists = az group exists --name $ResourceGroup --query "value" -o tsv
if ($rgExists -eq "false") {
    Write-Host "Creating resource group: $ResourceGroup" -ForegroundColor Yellow
    az group create --name $ResourceGroup --location "$Location"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create resource group"
        exit 1
    }
} else {
    Write-Host "Resource group already exists: $ResourceGroup" -ForegroundColor Green
}

# Step 3: Create Azure Container Registry if it doesn't exist
Write-Host "`n=== Step 3: Setting up Container Registry ===" -ForegroundColor Green

$registryName = $AzureContainerRegistry.Split('.')[0]
$registryExists = az acr show --name $registryName --resource-group $ResourceGroup --query "name" -o tsv 2>$null

if (-not $registryExists) {
    Write-Host "Creating Azure Container Registry: $registryName" -ForegroundColor Yellow
    az acr create --name $registryName --resource-group $ResourceGroup --sku Basic --admin-enabled true
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create container registry"
        exit 1
    }
} else {
    Write-Host "Container registry already exists: $registryName" -ForegroundColor Green
}

# Step 4: Deploy API Container Instance
Write-Host "`n=== Step 4: Deploying API Container Instance ===" -ForegroundColor Green

Write-Host "Deploying API container instance..." -ForegroundColor Yellow
az container create `
    --resource-group $ResourceGroup `
    --name "ai-cookbook-api" `
    --image "$AzureContainerRegistry/ai-cookbook-api:$ImageTag" `
    --registry-login-server $AzureContainerRegistry `
    --registry-username "$env:ACR_USERNAME" `
    --registry-password "$env:ACR_PASSWORD" `
    --cpu 0.5 `
    --memory 1 `
    --ports 4201 `
    --ip-address Public `
    --environment-variables `
        ASPNETCORE_ENVIRONMENT="Production" `
        ASPNETCORE_URLS="http://+:4201" `
        DISABLE_HTTPS_REDIRECTION="true" `
        CosmosDb__Endpoint="$env:COSMOS_ENDPOINT" `
        CosmosDb__Key="$env:COSMOS_KEY" `
        CosmosDb__DatabaseName="ai-cookbook" `
        CosmosDb__ContainerName="cookbooks" `
    --restart-policy Always

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy API container instance"
    exit 1
}

Write-Host "API container instance deployed successfully!" -ForegroundColor Green

# Step 5: Deploy Web Container Instance
Write-Host "`n=== Step 5: Deploying Web Container Instance ===" -ForegroundColor Green

# Get API container IP for environment variable
$apiIP = az container show --name "ai-cookbook-api" --resource-group $ResourceGroup --query "ipAddress.ip" -o tsv
Write-Host "API Container IP: $apiIP" -ForegroundColor Yellow

Write-Host "Deploying Web container instance..." -ForegroundColor Yellow
az container create `
    --resource-group $ResourceGroup `
    --name "ai-cookbook-web" `
    --image "$AzureContainerRegistry/ai-cookbook-web:$ImageTag" `
    --registry-login-server $AzureContainerRegistry `
    --registry-username "$env:ACR_USERNAME" `
    --registry-password "$env:ACR_PASSWORD" `
    --cpu 0.25 `
    --memory 0.5 `
    --ports 4200 `
    --ip-address Public `
    --environment-variables `
        API_BASE_URL="http://$apiIP:4201" `
    --restart-policy Always

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy Web container instance"
    exit 1
}

Write-Host "Web container instance deployed successfully!" -ForegroundColor Green

# Step 6: Get container IPs
Write-Host "`n=== Step 6: Getting Container Information ===" -ForegroundColor Green

$apiIP = az container show --name "ai-cookbook-api" --resource-group $ResourceGroup --query "ipAddress.ip" -o tsv
$webIP = az container show --name "ai-cookbook-web" --resource-group $ResourceGroup --query "ipAddress.ip" -o tsv

Write-Host "API Container IP: $apiIP" -ForegroundColor Yellow
Write-Host "Web Container IP: $webIP" -ForegroundColor Yellow

# Step 7: Display final status
Write-Host "`n=== Migration to ACI Completed Successfully! ===" -ForegroundColor Green

Write-Host "`nCost Savings:" -ForegroundColor Cyan
Write-Host "  Previous AKS Cost: ~400 EUR/month" -ForegroundColor White
Write-Host "  New ACI Cost: ~20-50 EUR/month" -ForegroundColor White
Write-Host "  Monthly Savings: ~350-380 EUR" -ForegroundColor Green

Write-Host "`nAccess URLs:" -ForegroundColor Cyan
Write-Host "  Web Application: http://$webIP:4200" -ForegroundColor White
Write-Host "  API: http://$apiIP:4201" -ForegroundColor White
Write-Host "  API Documentation: http://$apiIP:4201/swagger" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Test the application at the URLs above" -ForegroundColor White
Write-Host "2. Configure custom domain and SSL if needed" -ForegroundColor White
Write-Host "3. Set up monitoring and logging" -ForegroundColor White
Write-Host "4. Clean up AKS resources to avoid continued charges" -ForegroundColor White

Write-Host "`nManagement Commands:" -ForegroundColor Yellow
Write-Host "  View containers: az container list --resource-group $ResourceGroup" -ForegroundColor White
Write-Host "  View API logs: az container logs --name ai-cookbook-api --resource-group $ResourceGroup" -ForegroundColor White
Write-Host "  View Web logs: az container logs --name ai-cookbook-web --resource-group $ResourceGroup" -ForegroundColor White
Write-Host "  Restart API: az container restart --name ai-cookbook-api --resource-group $ResourceGroup" -ForegroundColor White
Write-Host "  Restart Web: az container restart --name ai-cookbook-web --resource-group $ResourceGroup" -ForegroundColor White

Write-Host "`nYour AI Cookbook is now running on Azure Container Instances!" -ForegroundColor Green
Write-Host "Enjoy the significant cost savings!" -ForegroundColor Green
