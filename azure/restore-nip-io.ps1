# PowerShell script to restore nip.io domain configuration for AI Cookbook
# This script applies the working nip.io domain setup

param(
    [string]$ResourceGroup = "AI-CookBook",
    [string]$AksClusterName = "k8s-ai-cookbook",
    [string]$SubscriptionName = "Playground - masp"
)

Write-Host "Restoring nip.io domain configuration for AI Cookbook..." -ForegroundColor Green

# Check if required tools are available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

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

# Get AKS credentials
Write-Host "Getting AKS credentials..." -ForegroundColor Yellow
az aks get-credentials --resource-group $ResourceGroup --name $AksClusterName --overwrite-existing

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to get AKS credentials. Please check your resource group and cluster name."
    exit 1
}

# Change to k8s/test directory
$originalLocation = Get-Location
Set-Location "../k8s/test"

Write-Host "`n=== Step 1: Removing current configuration ===" -ForegroundColor Green

# Check if the current ingress exists and delete it
$existingIngress = kubectl get ingress ai-cookbook-ingress-public -n ai-cookbook-test --ignore-not-found=true

if ($existingIngress) {
    Write-Host "Removing current ingress configuration..." -ForegroundColor Yellow
    kubectl delete ingress ai-cookbook-ingress-public -n ai-cookbook-test
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to delete current ingress, but continuing..."
    } else {
        Write-Host "Current ingress removed successfully!" -ForegroundColor Green
    }
}

# Check if the current certificate exists and delete it
$existingCert = kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test --ignore-not-found=true

if ($existingCert) {
    Write-Host "Removing current certificate..." -ForegroundColor Yellow
    kubectl delete certificate ai-cookbook-tls-public -n ai-cookbook-test
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to delete current certificate, but continuing..."
    } else {
        Write-Host "Current certificate removed successfully!" -ForegroundColor Green
    }
}

Write-Host "`n=== Step 2: Applying nip.io configuration ===" -ForegroundColor Green

# Apply the nip.io certificate resource
Write-Host "Applying nip.io certificate resource..." -ForegroundColor Yellow
kubectl apply -f certificate-public.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply certificate resource"
    Set-Location $originalLocation
    exit 1
}

# Apply the nip.io ingress configuration
Write-Host "Applying nip.io ingress configuration..." -ForegroundColor Yellow
kubectl apply -f ingress-public.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply ingress configuration"
    Set-Location $originalLocation
    exit 1
}

Write-Host "nip.io configuration applied successfully!" -ForegroundColor Green

# Return to original directory
Set-Location $originalLocation

Write-Host "`n=== Step 3: Checking configuration status ===" -ForegroundColor Green

# Check ingress status
Write-Host "`n=== Ingress Status ===" -ForegroundColor Yellow
kubectl get ingress -n ai-cookbook-test -o wide

# Check certificate status
Write-Host "`n=== Certificate Status ===" -ForegroundColor Yellow
kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test -o wide

# Check application pods
Write-Host "`n=== Application Status ===" -ForegroundColor Yellow
kubectl get pods -n ai-cookbook-test

Write-Host "`n=== nip.io Configuration Restored! ===" -ForegroundColor Green
Write-Host "`nYour AI Cookbook is accessible at:" -ForegroundColor Cyan
Write-Host "  Web Application: https://108.141.86.181.nip.io" -ForegroundColor White
Write-Host "  API: https://108.141.86.181.nip.io/api" -ForegroundColor White
Write-Host "  API Documentation: https://108.141.86.181.nip.io/swagger" -ForegroundColor White

Write-Host "`nNote: nip.io domains automatically resolve to their IP address" -ForegroundColor Yellow
Write-Host "The domain 108.141.86.181.nip.io will resolve to IP 108.141.86.181" -ForegroundColor White

Write-Host "`nTesting Instructions:" -ForegroundColor Green
Write-Host "1. Test from your browser: https://108.141.86.181.nip.io" -ForegroundColor White
Write-Host "2. Test API endpoints: https://108.141.86.181.nip.io/api" -ForegroundColor White
Write-Host "3. Test API documentation: https://108.141.86.181.nip.io/swagger" -ForegroundColor White

Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
Write-Host "If you encounter issues:" -ForegroundColor White
Write-Host "1. Check ingress status: kubectl get ingress -n ai-cookbook-test" -ForegroundColor White
Write-Host "2. Check certificate status: kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test" -ForegroundColor White
Write-Host "3. Check application pods: kubectl get pods -n ai-cookbook-test" -ForegroundColor White
Write-Host "4. Check ingress logs: kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx" -ForegroundColor White

Write-Host "`nnip.io configuration restored successfully!" -ForegroundColor Green
Write-Host "Your AI Cookbook is now using the nip.io domain!" -ForegroundColor Green
