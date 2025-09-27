# PowerShell script to apply the domain fix for AI Cookbook
# This script reverts from nip.io domain back to proper Azure cloudapp domain

param(
    [string]$ResourceGroup = "AI-CookBook",
    [string]$AksClusterName = "k8s-ai-cookbook",
    [string]$SubscriptionName = "Playground - masp"
)

Write-Host "Applying domain fix for AI Cookbook..." -ForegroundColor Green
Write-Host "Reverting from nip.io domain to Azure cloudapp domain" -ForegroundColor Yellow

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

Write-Host "`n=== Step 1: Removing old nip.io configuration ===" -ForegroundColor Green

# Check if the old ingress exists and delete it
$existingIngress = kubectl get ingress ai-cookbook-ingress-public -n ai-cookbook-test --ignore-not-found=true

if ($existingIngress) {
    Write-Host "Removing old ingress configuration..." -ForegroundColor Yellow
    kubectl delete ingress ai-cookbook-ingress-public -n ai-cookbook-test
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to delete old ingress, but continuing..."
    } else {
        Write-Host "Old ingress removed successfully!" -ForegroundColor Green
    }
}

# Check if the old certificate exists and delete it
$existingCert = kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test --ignore-not-found=true

if ($existingCert) {
    Write-Host "Removing old certificate..." -ForegroundColor Yellow
    kubectl delete certificate ai-cookbook-tls-public -n ai-cookbook-test
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to delete old certificate, but continuing..."
    } else {
        Write-Host "Old certificate removed successfully!" -ForegroundColor Green
    }
}

Write-Host "`n=== Step 2: Applying corrected configuration ===" -ForegroundColor Green

# Apply the corrected certificate resource
Write-Host "Applying corrected certificate resource..." -ForegroundColor Yellow
kubectl apply -f certificate-public.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply certificate resource"
    Set-Location $originalLocation
    exit 1
}

# Apply the corrected ingress configuration
Write-Host "Applying corrected ingress configuration..." -ForegroundColor Yellow
kubectl apply -f ingress-public.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply ingress configuration"
    Set-Location $originalLocation
    exit 1
}

Write-Host "Corrected configuration applied successfully!" -ForegroundColor Green

# Return to original directory
Set-Location $originalLocation

Write-Host "`n=== Step 3: Waiting for SSL Certificate ===" -ForegroundColor Green
Write-Host "Waiting for SSL certificate to be issued by Let's Encrypt..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

$maxAttempts = 60  # 10 minutes with 10-second intervals
$attempt = 0

do {
    $attempt++
    Write-Host "Checking certificate status (attempt $attempt/$maxAttempts)..." -ForegroundColor Yellow
    
    $certificateStatus = kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>$null
    
    if ($certificateStatus -eq "True") {
        Write-Host "SSL certificate issued successfully!" -ForegroundColor Green
        break
    } elseif ($certificateStatus -eq "False") {
        $reason = kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test -o jsonpath='{.status.conditions[?(@.type=="Ready")].message}' 2>$null
        Write-Host "Certificate issuance failed: $reason" -ForegroundColor Red
        Write-Host "You can check the certificate details with: kubectl describe certificate ai-cookbook-tls-public -n ai-cookbook-test" -ForegroundColor Cyan
        break
    }
    
    if ($attempt -ge $maxAttempts) {
        Write-Warning "Certificate issuance is taking longer than expected."
        Write-Host "You can check the status manually with: kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test" -ForegroundColor Cyan
        break
    }
    
    Start-Sleep -Seconds 10
} while ($true)

# Step 4: Display final status
Write-Host "`n=== Final Status ===" -ForegroundColor Green

Write-Host "`n=== Configuration Applied ===" -ForegroundColor Yellow
Write-Host "Domain: k8s-ai-cookbook-dns-e3byex43.hcp.westeurope.azmk8s.io (Azure AKS domain)" -ForegroundColor White
Write-Host "Certificate: ai-cookbook-tls-public" -ForegroundColor White
Write-Host "Ingress: ai-cookbook-ingress-public" -ForegroundColor White

Write-Host "`n=== SSL Certificate Status ===" -ForegroundColor Yellow
kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test -o wide

Write-Host "`n=== Ingress Status ===" -ForegroundColor Yellow
kubectl get ingress -n ai-cookbook-test -o wide

Write-Host "`n=== Application Status ===" -ForegroundColor Yellow
kubectl get pods -n ai-cookbook-test

Write-Host "`n=== Domain fix applied successfully! ===" -ForegroundColor Green
Write-Host "`nYour AI Cookbook is now accessible at:" -ForegroundColor Cyan
Write-Host "  Web Application: https://k8s-ai-cookbook-dns-e3byex43.hcp.westeurope.azmk8s.io" -ForegroundColor White
Write-Host "  API: https://k8s-ai-cookbook-dns-e3byex43.hcp.westeurope.azmk8s.io/api" -ForegroundColor White
Write-Host "  API Documentation: https://k8s-ai-cookbook-dns-e3byex43.hcp.westeurope.azmk8s.io/swagger" -ForegroundColor White

Write-Host "`nTesting Instructions:" -ForegroundColor Green
Write-Host "1. Test from your browser: https://k8s-ai-cookbook-dns-e3byex43.hcp.westeurope.azmk8s.io" -ForegroundColor White
Write-Host "2. Verify SSL certificate is valid and trusted" -ForegroundColor White
Write-Host "3. Test API endpoints work correctly" -ForegroundColor White

Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
Write-Host "If you encounter issues:" -ForegroundColor White
Write-Host "1. Check DNS resolution: nslookup k8s-ai-cookbook-dns-e3byex43.hcp.westeurope.azmk8s.io" -ForegroundColor White
Write-Host "2. Check ingress status: kubectl get ingress -n ai-cookbook-test" -ForegroundColor White
Write-Host "3. Check certificate status: kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test" -ForegroundColor White
Write-Host "4. Check ingress logs: kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx" -ForegroundColor White

Write-Host "`nDomain fix completed successfully!" -ForegroundColor Green
Write-Host "Your AI Cookbook is now using the proper Azure cloudapp domain!" -ForegroundColor Green
