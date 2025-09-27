# PowerShell script to set up DNS zone for AI Cookbook test environment
# This script creates the DNS zone and A record needed for the Azure cloudapp domain

param(
    [string]$ResourceGroup = "AI-CookBook",
    [string]$AksClusterName = "k8s-ai-cookbook",
    [string]$SubscriptionName = "Playground - masp"
)

Write-Host "Setting up DNS zone for AI Cookbook test environment..." -ForegroundColor Green

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

# Set the correct subscription
if ($azAccount -ne $SubscriptionName) {
    Write-Host "Switching to subscription: $SubscriptionName" -ForegroundColor Yellow
    az account set --subscription "$SubscriptionName"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to switch to subscription: $SubscriptionName"
        exit 1
    }
}

Write-Host "`n=== Step 1: Creating DNS Zone ===" -ForegroundColor Green

# Create DNS zone for westeurope.cloudapp.azure.com
Write-Host "Creating DNS zone: westeurope.cloudapp.azure.com" -ForegroundColor Yellow
az network dns zone create --resource-group $ResourceGroup --name "westeurope.cloudapp.azure.com"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create DNS zone"
    exit 1
}

Write-Host "DNS zone created successfully!" -ForegroundColor Green

Write-Host "`n=== Step 2: Getting Load Balancer External IP ===" -ForegroundColor Green

# Get AKS credentials
Write-Host "Getting AKS credentials..." -ForegroundColor Yellow
az aks get-credentials --resource-group $ResourceGroup --name $AksClusterName --overwrite-existing

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to get AKS credentials"
    exit 1
}

# Get the external IP of the ingress controller
Write-Host "Getting ingress controller external IP..." -ForegroundColor Yellow
$externalIP = kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null

if (-not $externalIP -or $externalIP -eq "") {
    Write-Error "No external IP found for ingress controller. Please ensure the ingress controller is running."
    exit 1
}

Write-Host "External IP found: $externalIP" -ForegroundColor Green

Write-Host "`n=== Step 3: Creating A Record ===" -ForegroundColor Green

# Create A record for ai-cookbook-test
Write-Host "Creating A record: ai-cookbook-test -> $externalIP" -ForegroundColor Yellow
az network dns record-set a add-record --resource-group $ResourceGroup --zone-name "westeurope.cloudapp.azure.com" --record-set-name "ai-cookbook-test" --ipv4-address $externalIP

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create A record"
    exit 1
}

Write-Host "A record created successfully!" -ForegroundColor Green

Write-Host "`n=== Step 4: Verifying DNS Resolution ===" -ForegroundColor Green

# Wait a moment for DNS propagation
Write-Host "Waiting for DNS propagation..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Test DNS resolution
Write-Host "Testing DNS resolution..." -ForegroundColor Yellow
$dnsResult = nslookup ai-cookbook-test.westeurope.cloudapp.azure.com 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "DNS resolution successful!" -ForegroundColor Green
} else {
    Write-Warning "DNS resolution failed. This may take a few minutes to propagate."
    Write-Host "You can test manually with: nslookup ai-cookbook-test.westeurope.cloudapp.azure.com" -ForegroundColor Cyan
}

Write-Host "`n=== DNS Setup Complete ===" -ForegroundColor Green
Write-Host "`n=== Configuration Summary ===" -ForegroundColor Yellow
Write-Host "DNS Zone: westeurope.cloudapp.azure.com" -ForegroundColor White
Write-Host "A Record: ai-cookbook-test -> $externalIP" -ForegroundColor White
Write-Host "Full Domain: ai-cookbook-test.westeurope.cloudapp.azure.com" -ForegroundColor White

Write-Host "`n=== Next Steps ===" -ForegroundColor Yellow
Write-Host "1. Wait for DNS propagation (may take 5-15 minutes)" -ForegroundColor White
Write-Host "2. Test DNS resolution: nslookup ai-cookbook-test.westeurope.cloudapp.azure.com" -ForegroundColor White
Write-Host "3. Re-run the domain fix script to re-issue the SSL certificate" -ForegroundColor White

Write-Host "`n=== Testing Commands ===" -ForegroundColor Yellow
Write-Host "Test DNS resolution:" -ForegroundColor White
Write-Host "  nslookup ai-cookbook-test.westeurope.cloudapp.azure.com" -ForegroundColor Cyan
Write-Host "`nRe-issue certificate:" -ForegroundColor White
Write-Host "  cd azure" -ForegroundColor Cyan
Write-Host "  .\apply-domain-fix.ps1" -ForegroundColor Cyan

Write-Host "`nDNS setup completed successfully!" -ForegroundColor Green
Write-Host "Your domain should be accessible once DNS propagation is complete!" -ForegroundColor Green
