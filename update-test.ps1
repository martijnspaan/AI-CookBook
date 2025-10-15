# AI Cookbook Test Environment Update Script
# This script builds new Docker images, pushes them to Azure Container Registry, and updates the unified ACI deployment in the test environment
#
# Usage:
#   .\update-test.ps1                    # Update both API and Web
#   .\update-test.ps1 -Image api         # Update only API
#   .\update-test.ps1 -Image web         # Update only Web
#   .\update-test.ps1 -ImageTag "1.0.1"  # Use custom image tag
#
# Prerequisites:
#   - Azure CLI logged in (az login)
#   - Docker running locally
#   - Access to Azure Container Registry

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("api", "web", "all")]
    [string]$Image = "all",
    [string]$ImageTag = "",
    [string]$ConfigPath = "k8s/test/secrets.config"
)

# Load secrets configuration
. "$PSScriptRoot/k8s/test/load-secrets.ps1"
$secrets = Load-SecretsConfig -ConfigPath $ConfigPath

# Set variables from secrets configuration
$AzureContainerRegistry = $secrets["AZURE_CONTAINER_REGISTRY"]
$ResourceGroup = $secrets["AZURE_RESOURCE_GROUP"]
$ContainerGroupName = $secrets["CONTAINER_GROUP_NAME"]
$CosmosDbConnectionString = $secrets["COSMOSDB_CONNECTION_STRING"]

# Generate timestamp-based tag if not provided
if ([string]::IsNullOrEmpty($ImageTag)) {
    $ImageTag = "test-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}

Write-Host "Starting AI Cookbook test environment update process..." -ForegroundColor Green
Write-Host "Target image(s): $Image" -ForegroundColor Cyan
Write-Host "Azure Container Registry: $AzureContainerRegistry" -ForegroundColor Cyan
Write-Host "Image tag: $ImageTag" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Cyan
Write-Host "Container Group: $ContainerGroupName" -ForegroundColor Cyan

# Check if required tools are available
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

# Check if unified container group exists
Write-Host "Checking unified container group..." -ForegroundColor Yellow
$containerExists = az container show --resource-group $ResourceGroup --name $ContainerGroupName --query "name" -o tsv 2>$null
if (-not $containerExists) {
    Write-Host "Unified container group '$ContainerGroupName' not found. Will create it with new images." -ForegroundColor Yellow
    $isNewDeployment = $true
} else {
    Write-Host "Found existing unified container group: $ContainerGroupName" -ForegroundColor Green
    $isNewDeployment = $false
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
    Write-Host "Building API Docker image (this may take several minutes)..." -ForegroundColor Yellow
    Write-Host "Starting API build at $(Get-Date)" -ForegroundColor Cyan
    
    docker build -t $AzureContainerRegistry/ai-cookbook-api:$ImageTag -f API/API.Application/Dockerfile API/

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build API image" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "API build completed at $(Get-Date)" -ForegroundColor Green

    Write-Host "Pushing API image to Azure Container Registry..." -ForegroundColor Yellow
    docker push $AzureContainerRegistry/ai-cookbook-api:$ImageTag

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to push API image" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "API image pushed successfully" -ForegroundColor Green
}

if ($Image -eq "all" -or $Image -eq "web") {
    Write-Host "Building Web Docker image (this may take several minutes)..." -ForegroundColor Yellow
    Write-Host "Starting Web build at $(Get-Date)" -ForegroundColor Cyan
    
    docker build -t $AzureContainerRegistry/ai-cookbook-web:$ImageTag -f Web/Dockerfile Web/

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build Web image" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Web build completed at $(Get-Date)" -ForegroundColor Green

    Write-Host "Pushing Web image to Azure Container Registry..." -ForegroundColor Yellow
    docker push $AzureContainerRegistry/ai-cookbook-web:$ImageTag

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to push Web image" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Web image pushed successfully" -ForegroundColor Green
}

# Deploy or update unified container group with new images
if ($isNewDeployment) {
    Write-Host "Creating new unified container group with images..." -ForegroundColor Yellow
    
    # For new deployment, ensure both images are built
    if ($Image -eq "api" -and (-not (docker images -q "$AzureContainerRegistry/ai-cookbook-web:$ImageTag"))) {
        Write-Host "Building Web image for new deployment..." -ForegroundColor Yellow
        docker build -t $AzureContainerRegistry/ai-cookbook-web:$ImageTag -f Web/Dockerfile Web/
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to build Web image" -ForegroundColor Red
            exit 1
        }
        docker push $AzureContainerRegistry/ai-cookbook-web:$ImageTag
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to push Web image" -ForegroundColor Red
            exit 1
        }
    } elseif ($Image -eq "web" -and (-not (docker images -q "$AzureContainerRegistry/ai-cookbook-api:$ImageTag"))) {
        Write-Host "Building API image for new deployment..." -ForegroundColor Yellow
        docker build -t $AzureContainerRegistry/ai-cookbook-api:$ImageTag -f API/API.Application/Dockerfile API/
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to build API image" -ForegroundColor Red
            exit 1
        }
        docker push $AzureContainerRegistry/ai-cookbook-api:$ImageTag
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to push API image" -ForegroundColor Red
            exit 1
        }
    }
    
    # For new deployment, use the new image tags for both containers
    $apiImage = "$AzureContainerRegistry/ai-cookbook-api:$ImageTag"
    $webImage = "$AzureContainerRegistry/ai-cookbook-web:$ImageTag"
    
    Write-Host "API Image: $apiImage" -ForegroundColor Cyan
    Write-Host "Web Image: $webImage" -ForegroundColor Cyan
} else {
    Write-Host "Updating existing unified container group with new images..." -ForegroundColor Yellow
    
    # Get current container group configuration BEFORE deleting to preserve existing image tags
    Write-Host "Getting current container group configuration..." -ForegroundColor Yellow
    $currentConfig = az container show --resource-group $ResourceGroup --name $ContainerGroupName --query "properties" -o json | ConvertFrom-Json

    # Determine which images to use based on what was built
    $apiImage = if ($Image -eq "all" -or $Image -eq "api") { 
        "$AzureContainerRegistry/ai-cookbook-api:$ImageTag" 
    } else { 
        $currentConfig.containers[0].image 
    }

    $webImage = if ($Image -eq "all" -or $Image -eq "web") { 
        "$AzureContainerRegistry/ai-cookbook-web:$ImageTag" 
    } else { 
        $currentConfig.containers[1].image 
    }

    Write-Host "API Image: $apiImage" -ForegroundColor Cyan
    Write-Host "Web Image: $webImage" -ForegroundColor Cyan
    
    # Delete existing container group
    Write-Host "Deleting existing container group..." -ForegroundColor Yellow
    az container delete --resource-group $ResourceGroup --name $ContainerGroupName --yes

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to delete existing container group. Continuing anyway..."
    }

    # Wait a moment for deletion to complete
    Start-Sleep -Seconds 10
}

# Create updated YAML configuration
$yamlConfig = @"
apiVersion: 2019-12-01
location: westeurope
name: $ContainerGroupName
properties:
  containers:
  - name: ai-cookbook-api
    properties:
      image: $apiImage
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
      image: $webImage
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
$yamlFile = "temp-update-container-group.yaml"
$yamlConfig | Out-File -FilePath $yamlFile -Encoding UTF8

# Create the container group with new images
Write-Host "Creating container group with new images..." -ForegroundColor Yellow
az container create --resource-group $ResourceGroup --file $yamlFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create container group" -ForegroundColor Red
    Remove-Item $yamlFile -ErrorAction SilentlyContinue
    exit 1
}

# Clean up temporary file
Remove-Item $yamlFile -ErrorAction SilentlyContinue
Write-Host "Recreated container group with new images" -ForegroundColor Green

# Wait for container group to be ready
Write-Host "Waiting for container group to be ready..." -ForegroundColor Yellow

$maxWaitTime = 300 # 5 minutes
$waitTime = 0
do {
    Start-Sleep -Seconds 10
    $waitTime += 10
    $groupState = az container show --resource-group $ResourceGroup --name $ContainerGroupName --query "properties.instanceView.state" -o tsv
    Write-Host "Container Group State: $groupState (waited $waitTime seconds)" -ForegroundColor Yellow
} while ($groupState -ne "Running" -and $waitTime -lt $maxWaitTime)

if ($groupState -ne "Running") {
    Write-Warning "Container group did not reach Running state within $maxWaitTime seconds"
}

# Check final container status
Write-Host "Checking final container status..." -ForegroundColor Green
az container show --resource-group $ResourceGroup --name $ContainerGroupName --query "{name:name, ipAddress:properties.ipAddress.ip, state:properties.instanceView.state, containers:properties.containers[].{name:name, state:properties.instanceView.currentState.state}}" -o table

# Get final IP address
$finalInfo = az container show --resource-group $ResourceGroup --name $ContainerGroupName --query "{ipAddress:properties.ipAddress.ip}" -o json | ConvertFrom-Json

$updatedServices = @()
if ($Image -eq "all" -or $Image -eq "api") { $updatedServices += "API" }
if ($Image -eq "all" -or $Image -eq "web") { $updatedServices += "Web" }

Write-Host "Update completed successfully for: $($updatedServices -join ', ')" -ForegroundColor Green
Write-Host "Test environment: http://$($finalInfo.ipAddress)" -ForegroundColor Cyan
Write-Host "API endpoints: http://$($finalInfo.ipAddress):4201" -ForegroundColor Cyan
Write-Host "API Swagger: http://$($finalInfo.ipAddress):4201/swagger" -ForegroundColor Cyan

Write-Host "`nTo check logs:" -ForegroundColor Yellow
Write-Host "API logs: az container logs --resource-group $ResourceGroup --name $ContainerGroupName --container-name ai-cookbook-api" -ForegroundColor White
Write-Host "Web logs: az container logs --resource-group $ResourceGroup --name $ContainerGroupName --container-name ai-cookbook-web" -ForegroundColor White

Write-Host "`nTo restart container group:" -ForegroundColor Yellow
Write-Host "Restart: az container restart --resource-group $ResourceGroup --name $ContainerGroupName" -ForegroundColor White
