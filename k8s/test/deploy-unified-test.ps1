# PowerShell script to deploy AI Cookbook to Azure Container Instances with shared IP
# Prerequisites: Azure CLI, Docker, Azure Container Registry access

param(
    [string]$ImageTag = "1.0.0-test",
    [string]$ConfigPath = "secrets.config",
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
$ContainerGroupName = $secrets["CONTAINER_GROUP_NAME"]
$CosmosDbConnectionString = $secrets["COSMOSDB_CONNECTION_STRING"]

Write-Host "Starting AI Cookbook unified deployment to Azure Container Instances (shared IP)..." -ForegroundColor Green

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

    # Check if container group exists
    $containerExists = az container show --resource-group $ResourceGroup --name $ContainerGroupName --query "name" -o tsv 2>$null
    if ($containerExists) {
        Write-Host "Container Group '$ContainerGroupName' found. It will be updated." -ForegroundColor Green
    } else {
        Write-Host "Container Group '$ContainerGroupName' not found. It will be created." -ForegroundColor Yellow
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

# Create unified container group with both API and Web containers
Write-Host "Creating unified container group with shared IP..." -ForegroundColor Yellow

az container create `
    --resource-group $ResourceGroup `
    --name $ContainerGroupName `
    --image $AzureContainerRegistry/ai-cookbook-api:$ImageTag `
    --registry-login-server $AzureContainerRegistry `
    --registry-username $(az acr credential show --name $AzureContainerRegistry.Split('.')[0] --query "username" -o tsv) `
    --registry-password $(az acr credential show --name $AzureContainerRegistry.Split('.')[0] --query "passwords[0].value" -o tsv) `
    --ports 4201 80 `
    --ip-address Public `
    --cpu 2 `
    --memory 3 `
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
        SWAGGER_ENABLED="true" `
        API_PORT=4201 `
        WEB_PORT=80

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create unified container group"
    exit 1
}

# Add the web container to the same group
Write-Host "Adding Web container to unified group..." -ForegroundColor Cyan

# Note: Azure CLI doesn't support adding containers to existing groups directly
# We need to recreate the group with both containers
Write-Host "Recreating container group with both API and Web containers..." -ForegroundColor Yellow

# Delete existing group first
az container delete --resource-group $ResourceGroup --name $ContainerGroupName --yes

# Create new group with both containers using YAML configuration
$yamlConfig = @"
apiVersion: 2019-12-01
location: westeurope
name: $ContainerGroupName
properties:
  containers:
  - name: ai-cookbook-api
    properties:
      image: $AzureContainerRegistry/ai-cookbook-api:$ImageTag
      resources:
        requests:
          cpu: 1
          memoryInGb: 2
      ports:
      - port: 4201
        protocol: TCP
      environmentVariables:
      - name: ASPNETCORE_ENVIRONMENT
        value: Test
      - name: ASPNETCORE_URLS
        value: http://+:4201
      - name: LOG_LEVEL
        value: Debug
      - name: COSMOSDB_CONNECTION_STRING
        value: "$CosmosDbConnectionString"
      - name: API_TITLE
        value: "AI Cookbook API - Test"
      - name: API_VERSION
        value: "1.0.0"
      - name: API_DESCRIPTION
        value: "AI Cookbook API for recipe management - Test Environment"
      - name: CORS_ALLOWED_ORIGINS
        value: "*"
      - name: SWAGGER_ENABLED
        value: "true"
  - name: ai-cookbook-web
    properties:
      image: $AzureContainerRegistry/ai-cookbook-web:1.0.1-test
      resources:
        requests:
          cpu: 1
          memoryInGb: 1
      ports:
      - port: 80
        protocol: TCP
      environmentVariables:
      - name: API_URL
        value: http://localhost:4201
  imageRegistryCredentials:
  - server: $AzureContainerRegistry
    username: $(az acr credential show --name $AzureContainerRegistry.Split('.')[0] --query "username" -o tsv)
    password: $(az acr credential show --name $AzureContainerRegistry.Split('.')[0] --query "passwords[0].value" -o tsv)
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 4201
    - protocol: TCP
      port: 80
  osType: Linux
  restartPolicy: Always
"@

# Save YAML to temporary file
$yamlFile = "temp-container-group.yaml"
$yamlConfig | Out-File -FilePath $yamlFile -Encoding UTF8

# Deploy using YAML
Write-Host "Deploying unified container group using YAML..." -ForegroundColor Cyan
az container create --resource-group $ResourceGroup --file $yamlFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create unified container group with YAML"
    Remove-Item $yamlFile -ErrorAction SilentlyContinue
    exit 1
}

# Clean up temporary file
Remove-Item $yamlFile -ErrorAction SilentlyContinue

Write-Host "Unified container group created successfully!" -ForegroundColor Green

# Wait for container group to be ready
Write-Host "Waiting for unified container group to be ready..." -ForegroundColor Yellow

$maxWaitTime = 300 # 5 minutes
$waitTime = 0
do {
    Start-Sleep -Seconds 10
    $waitTime += 10
    $groupState = az container show --resource-group $ResourceGroup --name $ContainerGroupName --query "instanceView.state" -o tsv
    Write-Host "Container Group State: $groupState (waited $waitTime seconds)" -ForegroundColor Yellow
} while ($groupState -ne "Running" -and $waitTime -lt $maxWaitTime)

if ($groupState -ne "Running") {
    Write-Warning "Container group did not reach Running state within $maxWaitTime seconds"
}

# Get container group information
Write-Host "Deployment completed! Container group information:" -ForegroundColor Green

Write-Host "`n=== Unified Container Group ===" -ForegroundColor Yellow
az container show --resource-group $ResourceGroup --name $ContainerGroupName --query "{name:name, ipAddress:ipAddress.ip, fqdn:ipAddress.fqdn, state:instanceView.state, containers:containers[].{name:name, state:instanceView.currentState.state}}" -o table

# Get final IP address
$finalInfo = az container show --resource-group $ResourceGroup --name $ContainerGroupName --query "{ipAddress:ipAddress.ip, fqdn:ipAddress.fqdn}" -o json | ConvertFrom-Json

Write-Host "`nTo access the application:" -ForegroundColor Cyan
Write-Host "Web Application: http://$($finalInfo.ipAddress)" -ForegroundColor White
Write-Host "API: http://$($finalInfo.ipAddress):4201" -ForegroundColor White
Write-Host "API Swagger: http://$($finalInfo.ipAddress):4201/swagger" -ForegroundColor White

Write-Host "`nTo check logs:" -ForegroundColor Cyan
Write-Host "API logs: az container logs --resource-group $ResourceGroup --name $ContainerGroupName --container-name ai-cookbook-api" -ForegroundColor White
Write-Host "Web logs: az container logs --resource-group $ResourceGroup --name $ContainerGroupName --container-name ai-cookbook-web" -ForegroundColor White

Write-Host "`nTo restart container group:" -ForegroundColor Cyan
Write-Host "Restart: az container restart --resource-group $ResourceGroup --name $ContainerGroupName" -ForegroundColor White

Write-Host "`nTo delete the container group:" -ForegroundColor Cyan
Write-Host "Delete: az container delete --resource-group $ResourceGroup --name $ContainerGroupName --yes" -ForegroundColor White

Write-Host "`nUnified deployment completed successfully with shared IP!" -ForegroundColor Green
