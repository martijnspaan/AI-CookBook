# PowerShell script to fix HTTPS configuration for AI Cookbook test environment
# This script updates an existing deployment to properly support HTTPS

param(
    [string]$ResourceGroup = "AI-CookBook",
    [string]$AksClusterName = "k8s-ai-cookbook",
    [string]$Domain = "ai-cookbook-test.westeurope.cloudapp.azure.com"
)

Write-Host "Fixing HTTPS configuration for AI Cookbook test environment..." -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Yellow

# Check if required tools are available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed or not in PATH"
    exit 1
}

if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
    Write-Error "OpenSSL is not installed or not in PATH. Please install OpenSSL to generate TLS certificates."
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

# Generate TLS certificate
Write-Host "Generating TLS certificate for $Domain..." -ForegroundColor Yellow
$certificateScript = "../../azure/generate-test-certificate.ps1"
if (Test-Path $certificateScript) {
    & $certificateScript -Domain $Domain -OutputPath "certificates"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to generate TLS certificate"
        Set-Location $originalLocation
        exit 1
    }
    Write-Host "TLS certificate generated successfully!" -ForegroundColor Green
} else {
    Write-Error "Certificate generation script not found at $certificateScript"
    Set-Location $originalLocation
    exit 1
}

# Apply the updated ingress configuration
Write-Host "Applying updated ingress configuration..." -ForegroundColor Yellow
kubectl apply -f ingress-test.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply ingress configuration"
    Set-Location $originalLocation
    exit 1
}

# Apply the TLS certificate
Write-Host "Applying TLS certificate..." -ForegroundColor Yellow
kubectl apply -f certificates/tls-secret-test.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply TLS certificate"
    Set-Location $originalLocation
    exit 1
}

# Wait for ingress to be ready
Write-Host "Waiting for ingress to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready --timeout=100s ingress/ai-cookbook-ingress-test -n ai-cookbook-test

# Get ingress information
Write-Host "`nIngress configuration updated! Checking status..." -ForegroundColor Green

Write-Host "`n=== Ingress Status ===" -ForegroundColor Yellow
kubectl get ingress -n ai-cookbook-test -o wide

Write-Host "`n=== TLS Secret Status ===" -ForegroundColor Yellow
kubectl get secret ai-cookbook-tls-test -n ai-cookbook-test -o yaml

Write-Host "`n=== Certificate Details ===" -ForegroundColor Yellow
kubectl get secret ai-cookbook-tls-test -n ai-cookbook-test -o jsonpath='{.data.tls\.crt}' | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) } | openssl x509 -text -noout | Select-String -Pattern "Subject:|DNS:|Not Before|Not After"

Write-Host "`nHTTPS configuration completed successfully!" -ForegroundColor Green
Write-Host "The application should now be accessible at:" -ForegroundColor Cyan
Write-Host "  https://$Domain" -ForegroundColor White
Write-Host "  https://$Domain/api" -ForegroundColor White
Write-Host "  https://$Domain/swagger" -ForegroundColor White

Write-Host "`nNote: If you see a security warning in your browser, this is expected for a self-signed certificate." -ForegroundColor Yellow
Write-Host "You can safely proceed by clicking 'Advanced' and 'Proceed to site'." -ForegroundColor Yellow

# Return to original directory
Set-Location $originalLocation

Write-Host "`nHTTPS fix completed successfully!" -ForegroundColor Green
