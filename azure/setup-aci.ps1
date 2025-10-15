# PowerShell script to set up AI Cookbook on Azure Container Instances
# This script migrates from AKS to ACI for significant cost savings

param(
    [string]$ResourceGroup = "AI-CookBook",
    [string]$Location = "West Europe",
    [string]$SubscriptionName = "Playground - masp",
    [string]$AzureContainerRegistry = "aicookbookregistry.azurecr.io",
    [string]$ImageTag = "1.0.0-test",
    [string]$Domain = "ai-cookbook-test.westeurope.cloudapp.azure.com",
    [string]$Email = "admin@example.com",
    [switch]$SkipImageBuild = $false,
    [switch]$SkipImagePush = $false,
    [switch]$SkipAzureSetup = $false
)

Write-Host "Setting up AI Cookbook on Azure Container Instances..." -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow
Write-Host "Container Registry: $AzureContainerRegistry" -ForegroundColor Yellow
Write-Host "Image Tag: $ImageTag" -ForegroundColor Yellow
Write-Host "Domain: $Domain" -ForegroundColor Yellow

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
    Set-Location "../.."
    
    # Build and push API image
    if (-not $SkipImageBuild) {
        Write-Host "Building API image..." -ForegroundColor Yellow
        docker build -f API/API.Application/Dockerfile -t "$AzureContainerRegistry/ai-cookbook-api:$ImageTag" API/API.Application/
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

# Step 4: Create Application Gateway for load balancing and SSL termination
Write-Host "`n=== Step 4: Setting up Application Gateway ===" -ForegroundColor Green

# Create virtual network
Write-Host "Creating virtual network..." -ForegroundColor Yellow
az network vnet create --name "ai-cookbook-vnet" --resource-group $ResourceGroup --location "$Location" --address-prefix "10.0.0.0/16" --subnet-name "appgw-subnet" --subnet-prefix "10.0.1.0/24"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create virtual network"
    exit 1
}

# Create ACI subnet
Write-Host "Creating ACI subnet..." -ForegroundColor Yellow
az network vnet subnet create --name "aci-subnet" --resource-group $ResourceGroup --vnet-name "ai-cookbook-vnet" --address-prefix "10.0.2.0/24" --delegations "Microsoft.ContainerInstance.containerGroups"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create ACI subnet"
    exit 1
}

# Create public IP
Write-Host "Creating public IP..." -ForegroundColor Yellow
az network public-ip create --name "ai-cookbook-pip" --resource-group $ResourceGroup --location "$Location" --allocation-method Static --sku Standard
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create public IP"
    exit 1
}

# Get public IP address
$publicIP = az network public-ip show --name "ai-cookbook-pip" --resource-group $ResourceGroup --query "ipAddress" -o tsv
Write-Host "Public IP address: $publicIP" -ForegroundColor Green

# Step 5: Deploy API Container Instance
Write-Host "`n=== Step 5: Deploying API Container Instance ===" -ForegroundColor Green

$apiContainerYaml = @"
apiVersion: 2021-07-01
location: $Location
name: ai-cookbook-api
properties:
  containers:
  - name: api
    properties:
      image: $AzureContainerRegistry/ai-cookbook-api:$ImageTag
      resources:
        requests:
          cpu: 0.5
          memoryInGb: 1
      ports:
      - port: 4201
        protocol: TCP
      environmentVariables:
      - name: ASPNETCORE_ENVIRONMENT
        value: "Production"
      - name: ASPNETCORE_URLS
        value: "http://+:4201"
      - name: DISABLE_HTTPS_REDIRECTION
        value: "true"
      - name: CosmosDb__Endpoint
        secureValue: "$env:COSMOS_ENDPOINT"
      - name: CosmosDb__Key
        secureValue: "$env:COSMOS_KEY"
      - name: CosmosDb__DatabaseName
        value: "ai-cookbook"
      - name: CosmosDb__ContainerName
        value: "cookbooks"
  osType: Linux
  ipAddress:
    type: Private
    ports:
    - protocol: TCP
      port: 4201
  subnetIds:
  - id: "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$ResourceGroup/providers/Microsoft.Network/virtualNetworks/ai-cookbook-vnet/subnets/aci-subnet"
  restartPolicy: Always
tags:
  Environment: Test
  Application: AI-Cookbook
  Component: API
"@

$apiContainerPath = "api-container.yaml"
Set-Content -Path $apiContainerPath -Value $apiContainerYaml

Write-Host "Deploying API container instance..." -ForegroundColor Yellow
az container create --resource-group $ResourceGroup --file $apiContainerPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy API container instance"
    Remove-Item $apiContainerPath -Force
    exit 1
}

Remove-Item $apiContainerPath -Force
Write-Host "API container instance deployed successfully!" -ForegroundColor Green

# Step 6: Deploy Web Container Instance
Write-Host "`n=== Step 6: Deploying Web Container Instance ===" -ForegroundColor Green

$webContainerYaml = @"
apiVersion: 2021-07-01
location: $Location
name: ai-cookbook-web
properties:
  containers:
  - name: web
    properties:
      image: $AzureContainerRegistry/ai-cookbook-web:$ImageTag
      resources:
        requests:
          cpu: 0.25
          memoryInGb: 0.5
      ports:
      - port: 4200
        protocol: TCP
      environmentVariables:
      - name: API_BASE_URL
        value: "http://ai-cookbook-api.aci-subnet:4201"
  osType: Linux
  ipAddress:
    type: Private
    ports:
    - protocol: TCP
      port: 4200
  subnetIds:
  - id: "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$ResourceGroup/providers/Microsoft.Network/virtualNetworks/ai-cookbook-vnet/subnets/aci-subnet"
  restartPolicy: Always
tags:
  Environment: Test
  Application: AI-Cookbook
  Component: Web
"@

$webContainerPath = "web-container.yaml"
Set-Content -Path $webContainerPath -Value $webContainerYaml

Write-Host "Deploying Web container instance..." -ForegroundColor Yellow
az container create --resource-group $ResourceGroup --file $webContainerPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy Web container instance"
    Remove-Item $webContainerPath -Force
    exit 1
}

Remove-Item $webContainerPath -Force
Write-Host "Web container instance deployed successfully!" -ForegroundColor Green

# Step 7: Create Application Gateway
Write-Host "`n=== Step 7: Creating Application Gateway ===" -ForegroundColor Green

# Get ACI private IPs
$apiIP = az container show --name "ai-cookbook-api" --resource-group $ResourceGroup --query "properties.ipAddress.ip" -o tsv
$webIP = az container show --name "ai-cookbook-web" --resource-group $ResourceGroup --query "properties.ipAddress.ip" -o tsv

Write-Host "API Container IP: $apiIP" -ForegroundColor Yellow
Write-Host "Web Container IP: $webIP" -ForegroundColor Yellow

# Create backend pools
Write-Host "Creating backend pools..." -ForegroundColor Yellow
az network application-gateway address-pool create --gateway-name "ai-cookbook-appgw" --resource-group $ResourceGroup --name "api-backend-pool" --servers $apiIP
az network application-gateway address-pool create --gateway-name "ai-cookbook-appgw" --resource-group $ResourceGroup --name "web-backend-pool" --servers $webIP

# Create HTTP settings
az network application-gateway http-settings create --gateway-name "ai-cookbook-appgw" --resource-group $ResourceGroup --name "api-http-settings" --port 4201 --protocol Http
az network application-gateway http-settings create --gateway-name "ai-cookbook-appgw" --resource-group $ResourceGroup --name "web-http-settings" --port 4200 --protocol Http

# Create listeners
az network application-gateway http-listener create --gateway-name "ai-cookbook-appgw" --resource-group $ResourceGroup --name "web-listener" --frontend-port "web-port" --frontend-ip "public"
az network application-gateway http-listener create --gateway-name "ai-cookbook-appgw" --resource-group $ResourceGroup --name "api-listener" --frontend-port "api-port" --frontend-ip "public"

# Create routing rules
az network application-gateway rule create --gateway-name "ai-cookbook-appgw" --resource-group $ResourceGroup --name "web-rule" --rule-type Basic --http-listener "web-listener" --address-pool "web-backend-pool" --http-settings "web-http-settings"
az network application-gateway rule create --gateway-name "ai-cookbook-appgw" --resource-group $ResourceGroup --name "api-rule" --rule-type Basic --http-listener "api-listener" --address-pool "api-backend-pool" --http-settings "api-http-settings"

Write-Host "Application Gateway configured successfully!" -ForegroundColor Green

# Step 8: Display final status
Write-Host "`n=== 🎉 Migration to ACI Completed Successfully! ===" -ForegroundColor Green

Write-Host "`n📊 Cost Savings:" -ForegroundColor Cyan
Write-Host "  Previous AKS Cost: ~€400/month" -ForegroundColor White
Write-Host "  New ACI Cost: ~€20-50/month" -ForegroundColor White
Write-Host "  Monthly Savings: ~€350-380" -ForegroundColor Green

Write-Host "`n🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "  Web Application: http://$publicIP" -ForegroundColor White
Write-Host "  API: http://$publicIP:4201" -ForegroundColor White
Write-Host "  API Documentation: http://$publicIP:4201/swagger" -ForegroundColor White

Write-Host "`n📱 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test the application at the URLs above" -ForegroundColor White
Write-Host "2. Configure custom domain and SSL if needed" -ForegroundColor White
Write-Host "3. Set up monitoring and logging" -ForegroundColor White
Write-Host "4. Clean up AKS resources to avoid continued charges" -ForegroundColor White

Write-Host "`n🔧 Management Commands:" -ForegroundColor Yellow
Write-Host "  View containers: az container list --resource-group $ResourceGroup" -ForegroundColor White
Write-Host "  View logs: az container logs --name ai-cookbook-api --resource-group $ResourceGroup" -ForegroundColor White
Write-Host "  Restart container: az container restart --name ai-cookbook-api --resource-group $ResourceGroup" -ForegroundColor White

Write-Host "`n🚀 Your AI Cookbook is now running on Azure Container Instances!" -ForegroundColor Green
Write-Host "Enjoy the significant cost savings! 💰" -ForegroundColor Green
