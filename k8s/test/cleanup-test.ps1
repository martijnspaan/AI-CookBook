# PowerShell script to clean up AI Cookbook test environment from Azure Container Instances
# Prerequisites: Azure CLI

param(
    [string]$ResourceGroup = "rg-martijn",
    [string]$ApiContainerGroupName = "ai-cookbook-api",
    [string]$WebContainerGroupName = "ai-cookbook-web",
    [switch]$Force = $false
)

Write-Host "Starting AI Cookbook test environment cleanup..." -ForegroundColor Yellow

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

# Verify container groups exist
Write-Host "Checking container groups..." -ForegroundColor Yellow
$apiExists = az container show --resource-group $ResourceGroup --name $ApiContainerGroupName --query "name" -o tsv 2>$null
$webExists = az container show --resource-group $ResourceGroup --name $WebContainerGroupName --query "name" -o tsv 2>$null

if (-not $apiExists -and -not $webExists) {
    Write-Host "No container groups found to clean up." -ForegroundColor Yellow
    exit 0
}

# Confirm deletion unless forced
if (-not $Force) {
    $confirmation = Read-Host "Are you sure you want to delete the AI Cookbook test environment container groups? This will remove the API and Web containers. Type 'yes' to confirm"
    if ($confirmation -ne "yes") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Deleting test environment container groups..." -ForegroundColor Yellow

# Delete API Container Group
if ($apiExists) {
    Write-Host "Deleting API Container Group '$ApiContainerGroupName'..." -ForegroundColor Cyan
    az container delete --resource-group $ResourceGroup --name $ApiContainerGroupName --yes
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "API Container Group deleted successfully!" -ForegroundColor Green
    } else {
        Write-Warning "Failed to delete API Container Group"
    }
}

# Delete Web Container Group
if ($webExists) {
    Write-Host "Deleting Web Container Group '$WebContainerGroupName'..." -ForegroundColor Cyan
    az container delete --resource-group $ResourceGroup --name $WebContainerGroupName --yes
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Web Container Group deleted successfully!" -ForegroundColor Green
    } else {
        Write-Warning "Failed to delete Web Container Group"
    }
}

# List remaining container groups to verify
Write-Host "`nRemaining container groups in resource group '$ResourceGroup':" -ForegroundColor Cyan
az container list --resource-group $ResourceGroup --query "[].{Name:name, State:containers[0].instanceView.currentState.state, IP:ipAddress.ip}" -o table

Write-Host "`nCleanup completed!" -ForegroundColor Green
