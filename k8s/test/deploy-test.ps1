# PowerShell script to deploy AI Cookbook to Azure Kubernetes test environment
# Prerequisites: Azure CLI, kubectl, Docker, Azure Container Registry access

param(
    [string]$ImageTag = "1.0.0-test",
    [string]$ConfigPath = "secrets.config",
    [string]$ApiContainerGroupName = "ai-cookbook-api",
    [string]$WebContainerGroupName = "ai-cookbook-web",
    [switch]$SkipImageBuild = $false,
    [switch]$SkipImagePush = $false,
    [switch]$SkipAzureSetup = $false
)

# Load secrets configuration
. "$PSScriptRoot/load-secrets.ps1"
$secrets = Load-SecretsConfig -ConfigPath $ConfigPath

# Set variables from secrets configuration
$AzureContainerRegistry = $secrets["AZURE_CONTAINER_REGISTRY"]
$ResourceGroup = $secrets["AZURE_RESOURCE_GROUP"]
$CosmosDbConnectionString = $secrets["COSMOSDB_CONNECTION_STRING"]

Write-Host "Starting AI Cookbook test environment deployment to Azure Container Instances (ACI)..." -ForegroundColor Green

# Check if required tools are available
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed or not in PATH"
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH"
    exit 1
}

# Azure setup (skip if called from mobile access script)
if (-not $SkipAzureSetup) {
    Write-Host "Performing Azure setup..." -ForegroundColor Yellow
    
    # Check if logged into Azure
    Write-Host "Checking Azure authentication..." -ForegroundColor Yellow
    $azAccount = az account show --query "name" -o tsv 2>$null
    if (-not $azAccount) {
        Write-Error "Not logged into Azure. Please run 'az login' first."
        exit 1
    }
    Write-Host "Logged into Azure as: $azAccount" -ForegroundColor Green

    # Check if ACI resources exist, create if they don't
    Write-Host "Checking Azure Container Instances..." -ForegroundColor Yellow
    
    # Check API Container Group
    $apiExists = az container show --resource-group $ResourceGroup --name $ApiContainerGroupName --query "name" -o tsv 2>$null
    if (-not $apiExists) {
        Write-Host "API Container Group '$ApiContainerGroupName' not found. It will be created during deployment." -ForegroundColor Yellow
    } else {
        Write-Host "API Container Group '$ApiContainerGroupName' found." -ForegroundColor Green
    }
    
    # Check Web Container Group
    $webExists = az container show --resource-group $ResourceGroup --name $WebContainerGroupName --query "name" -o tsv 2>$null
    if (-not $webExists) {
        Write-Host "Web Container Group '$WebContainerGroupName' not found. It will be created during deployment." -ForegroundColor Yellow
    } else {
        Write-Host "Web Container Group '$WebContainerGroupName' found." -ForegroundColor Green
    }

    # Login to Azure Container Registry
    Write-Host "Logging into Azure Container Registry..." -ForegroundColor Yellow
    az acr login --name $AzureContainerRegistry.Split('.')[0]

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to login to Azure Container Registry. Please check your registry name and permissions."
        exit 1
    }
} else {
    Write-Host "Skipping Azure setup (handled by calling script)..." -ForegroundColor Yellow
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

# Get current container instance information
Write-Host "Getting current container instance information..." -ForegroundColor Yellow

$apiInfo = az container show --resource-group $ResourceGroup --name $ApiContainerGroupName --query "{ipAddress:ipAddress.ip, fqdn:ipAddress.fqdn, state:containers[0].instanceView.currentState.state}" -o json | ConvertFrom-Json
$webInfo = az container show --resource-group $ResourceGroup --name $WebContainerGroupName --query "{ipAddress:ipAddress.ip, fqdn:ipAddress.fqdn, state:containers[0].instanceView.currentState.state}" -o json | ConvertFrom-Json

Write-Host "Current API Container - IP: $($apiInfo.ipAddress), State: $($apiInfo.state)" -ForegroundColor Cyan
Write-Host "Current Web Container - IP: $($webInfo.ipAddress), State: $($webInfo.state)" -ForegroundColor Cyan

# Deploy updated images to Azure Container Instances
Write-Host "Deploying updated images to Azure Container Instances..." -ForegroundColor Yellow

# Create or update API Container Group with new image
Write-Host "Creating/updating API Container Group with new image..." -ForegroundColor Cyan
az container create `
    --resource-group $ResourceGroup `
    --name $ApiContainerGroupName `
    --image $AzureContainerRegistry/ai-cookbook-api:$ImageTag `
    --registry-login-server $AzureContainerRegistry `
    --registry-username $(az acr credential show --name $AzureContainerRegistry.Split('.')[0] --query "username" -o tsv) `
    --registry-password $(az acr credential show --name $AzureContainerRegistry.Split('.')[0] --query "passwords[0].value" -o tsv) `
    --ports 4201 `
    --ip-address Public `
    --cpu 1 `
    --memory 2 `
    --restart-policy Always `
    --environment-variables `
        ASPNETCORE_ENVIRONMENT=Test `
        ASPNETCORE_URLS=http://+:4201 `
        LOG_LEVEL=Debug `
        COSMOSDB_CONNECTION_STRING="$CosmosDbConnectionString" `
        API_TITLE="AI Cookbook API - Test" `
        API_VERSION="1.0.0" `
        API_DESCRIPTION="AI Cookbook API for recipe management - Test Environment" `
        CORS_ALLOWED_ORIGINS="*" `
        SWAGGER_ENABLED="true"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to update API Container Group"
    exit 1
}

# Create or update Web Container Group with new image
Write-Host "Creating/updating Web Container Group with new image..." -ForegroundColor Cyan
az container create `
    --resource-group $ResourceGroup `
    --name $WebContainerGroupName `
    --image $AzureContainerRegistry/ai-cookbook-web:$ImageTag `
    --registry-login-server $AzureContainerRegistry `
    --registry-username $(az acr credential show --name $AzureContainerRegistry.Split('.')[0] --query "username" -o tsv) `
    --registry-password $(az acr credential show --name $AzureContainerRegistry.Split('.')[0] --query "passwords[0].value" -o tsv) `
    --ports 80 `
    --ip-address Public `
    --cpu 1 `
    --memory 1 `
    --restart-policy Always

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to update Web Container Group"
    exit 1
}

Write-Host "Azure Container Instances updated successfully!" -ForegroundColor Green

# Wait for container instances to be ready
Write-Host "Waiting for container instances to be ready..." -ForegroundColor Yellow

# Wait for API container
Write-Host "Waiting for API container to be running..." -ForegroundColor Cyan
$maxWaitTime = 300 # 5 minutes
$waitTime = 0
do {
    Start-Sleep -Seconds 10
    $waitTime += 10
    $apiState = az container show --resource-group $ResourceGroup --name $ApiContainerGroupName --query "containers[0].instanceView.currentState.state" -o tsv
    Write-Host "API Container State: $apiState (waited $waitTime seconds)" -ForegroundColor Yellow
} while ($apiState -ne "Running" -and $waitTime -lt $maxWaitTime)

if ($apiState -ne "Running") {
    Write-Warning "API container did not reach Running state within $maxWaitTime seconds"
}

# Wait for Web container
Write-Host "Waiting for Web container to be running..." -ForegroundColor Cyan
$waitTime = 0
do {
    Start-Sleep -Seconds 10
    $waitTime += 10
    $webState = az container show --resource-group $ResourceGroup --name $WebContainerGroupName --query "containers[0].instanceView.currentState.state" -o tsv
    Write-Host "Web Container State: $webState (waited $waitTime seconds)" -ForegroundColor Yellow
} while ($webState -ne "Running" -and $waitTime -lt $maxWaitTime)

if ($webState -ne "Running") {
    Write-Warning "Web container did not reach Running state within $maxWaitTime seconds"
}

# Get container instance information
Write-Host "Deployment completed! Container instance information:" -ForegroundColor Green

Write-Host "`n=== API Container Group ===" -ForegroundColor Yellow
az container show --resource-group $ResourceGroup --name $ApiContainerGroupName --query "{name:name, ipAddress:ipAddress.ip, fqdn:ipAddress.fqdn, state:containers[0].instanceView.currentState.state, restartCount:containers[0].instanceView.restartCount}" -o table

Write-Host "`n=== Web Container Group ===" -ForegroundColor Yellow
az container show --resource-group $ResourceGroup --name $WebContainerGroupName --query "{name:name, ipAddress:ipAddress.ip, fqdn:ipAddress.fqdn, state:containers[0].instanceView.currentState.state, restartCount:containers[0].instanceView.restartCount}" -o table

# Get final IP addresses
$finalApiInfo = az container show --resource-group $ResourceGroup --name $ApiContainerGroupName --query "{ipAddress:ipAddress.ip, fqdn:ipAddress.fqdn}" -o json | ConvertFrom-Json
$finalWebInfo = az container show --resource-group $ResourceGroup --name $WebContainerGroupName --query "{ipAddress:ipAddress.ip, fqdn:ipAddress.fqdn}" -o json | ConvertFrom-Json

Write-Host "`nTo access the application:" -ForegroundColor Cyan
Write-Host "Web Application: http://$($finalWebInfo.ipAddress)" -ForegroundColor White
Write-Host "API: http://$($finalApiInfo.ipAddress):4201" -ForegroundColor White
Write-Host "API Swagger: http://$($finalApiInfo.ipAddress):4201/swagger" -ForegroundColor White

Write-Host "`nTo check logs:" -ForegroundColor Cyan
Write-Host "API logs: az container logs --resource-group $ResourceGroup --name $ApiContainerGroupName" -ForegroundColor White
Write-Host "Web logs: az container logs --resource-group $ResourceGroup --name $WebContainerGroupName" -ForegroundColor White

Write-Host "`nTo restart containers:" -ForegroundColor Cyan
Write-Host "API restart: az container restart --resource-group $ResourceGroup --name $ApiContainerGroupName" -ForegroundColor White
Write-Host "Web restart: az container restart --resource-group $ResourceGroup --name $WebContainerGroupName" -ForegroundColor White

Write-Host "`nTo delete the containers:" -ForegroundColor Cyan
Write-Host "API delete: az container delete --resource-group $ResourceGroup --name $ApiContainerGroupName --yes" -ForegroundColor White
Write-Host "Web delete: az container delete --resource-group $ResourceGroup --name $WebContainerGroupName --yes" -ForegroundColor White

Write-Host "`nTest environment deployment completed successfully!" -ForegroundColor Green
