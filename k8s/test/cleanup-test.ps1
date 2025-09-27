# PowerShell script to clean up AI Cookbook test environment from Azure Kubernetes
# Prerequisites: Azure CLI, kubectl

param(
    [string]$ResourceGroup = "ai-cookbook-rg",
    [string]$AksClusterName = "ai-cookbook-aks",
    [switch]$Force = $false
)

Write-Host "Starting AI Cookbook test environment cleanup..." -ForegroundColor Yellow

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

# Get AKS credentials
Write-Host "Getting AKS credentials..." -ForegroundColor Yellow
az aks get-credentials --resource-group $ResourceGroup --name $AksClusterName --overwrite-existing

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to get AKS credentials. Please check your resource group and cluster name."
    exit 1
}

# Confirm deletion unless forced
if (-not $Force) {
    $confirmation = Read-Host "Are you sure you want to delete the AI Cookbook test environment? This will remove all resources in the 'ai-cookbook-test' namespace. Type 'yes' to confirm"
    if ($confirmation -ne "yes") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Deleting test environment resources..." -ForegroundColor Yellow

# Delete the entire namespace (this will delete all resources within it)
kubectl delete namespace ai-cookbook-test

if ($LASTEXITCODE -eq 0) {
    Write-Host "Test environment cleaned up successfully!" -ForegroundColor Green
} else {
    Write-Warning "Some resources may not have been deleted. Please check manually."
}

# List remaining namespaces to verify
Write-Host "`nRemaining namespaces:" -ForegroundColor Cyan
kubectl get namespaces

Write-Host "`nCleanup completed!" -ForegroundColor Green
