# PowerShell script to clean up AI Cookbook unified test environment from Azure Container Instances
# Prerequisites: Azure CLI

param(
    [string]$ResourceGroup = "rg-martijn",
    [string]$ContainerGroupName = "ai-cookbook-unified",
    [switch]$Force = $false
)

Write-Host "Starting AI Cookbook unified test environment cleanup..." -ForegroundColor Yellow

# Check if required tools are available
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

# Verify container group exists
Write-Host "Checking unified container group..." -ForegroundColor Yellow
$containerExists = az container show --resource-group $ResourceGroup --name $ContainerGroupName --query "name" -o tsv 2>$null

if (-not $containerExists) {
    Write-Host "Unified container group '$ContainerGroupName' not found in resource group '$ResourceGroup'." -ForegroundColor Yellow
    exit 0
}

# Confirm deletion unless forced
if (-not $Force) {
    $confirmation = Read-Host "Are you sure you want to delete the AI Cookbook unified test environment? This will remove the container group with both API and Web containers. Type 'yes' to confirm"
    if ($confirmation -ne "yes") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Deleting unified container group..." -ForegroundColor Yellow

# Delete unified container group
Write-Host "Deleting unified container group '$ContainerGroupName'..." -ForegroundColor Cyan
az container delete --resource-group $ResourceGroup --name $ContainerGroupName --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "Unified container group deleted successfully!" -ForegroundColor Green
} else {
    Write-Warning "Failed to delete unified container group"
}

# List remaining container groups to verify
Write-Host "`nRemaining container groups in resource group '$ResourceGroup':" -ForegroundColor Cyan
az container list --resource-group $ResourceGroup --query "[].{Name:name, State:instanceView.state, IP:ipAddress.ip}" -o table

Write-Host "`nUnified cleanup completed!" -ForegroundColor Green
