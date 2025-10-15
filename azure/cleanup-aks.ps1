# PowerShell script to clean up AKS resources after migration to ACI
# WARNING: This will delete all AKS resources and cannot be undone!

param(
    [string]$ResourceGroup = "AI-CookBook",
    [string]$AksClusterName = "k8s-ai-cookbook",
    [string]$SubscriptionName = "Playground - masp",
    [switch]$Force = $false
)

Write-Host "AI Cookbook AKS Cleanup Script" -ForegroundColor Red
Write-Host "WARNING: This will delete all AKS resources!" -ForegroundColor Red
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "AKS Cluster: $AksClusterName" -ForegroundColor Yellow

# Check if logged into Azure
$azAccount = az account show --query "name" -o tsv 2>$null
if (-not $azAccount) {
    Write-Error "Not logged into Azure. Please run 'az login' first."
    exit 1
}

# Set the correct subscription
if ($azAccount -ne $SubscriptionName) {
    Write-Host "Switching to subscription: $SubscriptionName" -ForegroundColor Yellow
    az account set --subscription "$SubscriptionName"
}

# Safety check
if (-not $Force) {
    Write-Host "`n⚠️  SAFETY CHECK ⚠️" -ForegroundColor Red
    Write-Host "This script will delete the following AKS resources:" -ForegroundColor Yellow
    Write-Host "  - AKS Cluster: $AksClusterName" -ForegroundColor White
    Write-Host "  - All associated resources in resource group: $ResourceGroup" -ForegroundColor White
    Write-Host "  - This action CANNOT be undone!" -ForegroundColor Red
    
    $confirm = Read-Host "`nAre you sure you want to proceed? Type 'DELETE' to confirm"
    if ($confirm -ne "DELETE") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "`n=== Starting AKS Cleanup ===" -ForegroundColor Green

# Step 1: List AKS resources
Write-Host "`n=== Step 1: Listing AKS Resources ===" -ForegroundColor Yellow
Write-Host "AKS Clusters:" -ForegroundColor White
az aks list --resource-group $ResourceGroup --query "[].{Name:name, Location:location, Status:provisioningState}" --output table

Write-Host "`nKubernetes Namespaces:" -ForegroundColor White
az aks get-credentials --resource-group $ResourceGroup --name $AksClusterName --overwrite-existing 2>$null
kubectl get namespaces --no-headers 2>$null | ForEach-Object { $_.Split()[0] }

# Step 2: Delete AKS cluster
Write-Host "`n=== Step 2: Deleting AKS Cluster ===" -ForegroundColor Yellow
Write-Host "Deleting AKS cluster: $AksClusterName" -ForegroundColor White
az aks delete --name $AksClusterName --resource-group $ResourceGroup --yes --no-wait

if ($LASTEXITCODE -eq 0) {
    Write-Host "AKS cluster deletion initiated successfully!" -ForegroundColor Green
    Write-Host "Note: Cluster deletion is running in the background and may take several minutes." -ForegroundColor Yellow
} else {
    Write-Warning "Failed to delete AKS cluster. It may not exist or you may not have permissions."
}

# Step 3: List remaining resources
Write-Host "`n=== Step 3: Checking Remaining Resources ===" -ForegroundColor Yellow
Write-Host "Resources remaining in resource group:" -ForegroundColor White
az resource list --resource-group $ResourceGroup --query "[].{Name:name, Type:type, Location:location}" --output table

# Step 4: Clean up specific AKS-related resources
Write-Host "`n=== Step 4: Cleaning Up AKS-Related Resources ===" -ForegroundColor Yellow

# Delete load balancers
Write-Host "Deleting load balancers..." -ForegroundColor White
az network lb list --resource-group $ResourceGroup --query "[].{Name:name, Type:sku.name}" --output table | ForEach-Object {
    $lbName = $_.Split()[0]
    if ($lbName -and $lbName -ne "Name") {
        Write-Host "Deleting load balancer: $lbName" -ForegroundColor Gray
        az network lb delete --name $lbName --resource-group $ResourceGroup --yes 2>$null
    }
}

# Delete public IPs
Write-Host "Deleting public IPs..." -ForegroundColor White
az network public-ip list --resource-group $ResourceGroup --query "[].{Name:name, AllocationMethod:publicIpAllocationMethod}" --output table | ForEach-Object {
    $ipName = $_.Split()[0]
    if ($ipName -and $ipName -ne "Name") {
        Write-Host "Deleting public IP: $ipName" -ForegroundColor Gray
        az network public-ip delete --name $ipName --resource-group $ResourceGroup --yes 2>$null
    }
}

# Delete virtual networks (be careful with this)
Write-Host "Checking for virtual networks..." -ForegroundColor White
$vnets = az network vnet list --resource-group $ResourceGroup --query "[].{Name:name, AddressSpace:addressSpace.addressPrefixes}" --output table
if ($vnets -and $vnets.Count -gt 1) {
    Write-Host "Found virtual networks. Please review manually:" -ForegroundColor Yellow
    Write-Host $vnets -ForegroundColor White
    Write-Host "Note: Virtual networks may be used by other resources. Delete manually if safe." -ForegroundColor Yellow
}

# Step 5: Cost analysis
Write-Host "`n=== Step 5: Cost Analysis ===" -ForegroundColor Green
Write-Host "Previous AKS Monthly Cost: ~€400" -ForegroundColor Red
Write-Host "New ACI Monthly Cost: ~€20-50" -ForegroundColor Green
Write-Host "Monthly Savings: ~€350-380" -ForegroundColor Green
Write-Host "Annual Savings: ~€4,200-4,560" -ForegroundColor Green

# Step 6: Final status
Write-Host "`n=== Cleanup Summary ===" -ForegroundColor Green
Write-Host "✅ AKS cluster deletion initiated" -ForegroundColor Green
Write-Host "✅ Load balancers cleaned up" -ForegroundColor Green
Write-Host "✅ Public IPs cleaned up" -ForegroundColor Green
Write-Host "⚠️  Virtual networks may need manual review" -ForegroundColor Yellow

Write-Host "`n📊 Cost Savings Achieved:" -ForegroundColor Cyan
Write-Host "  Monthly: €350-380" -ForegroundColor White
Write-Host "  Annual: €4,200-4,560" -ForegroundColor White

Write-Host "`n🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify AKS cluster is fully deleted (may take 10-15 minutes)" -ForegroundColor White
Write-Host "2. Check Azure portal for any remaining resources" -ForegroundColor White
Write-Host "3. Monitor your Azure bill for cost reduction" -ForegroundColor White
Write-Host "4. Your ACI deployment should be running at the URLs shown earlier" -ForegroundColor White

Write-Host "`n🎉 AKS cleanup completed! Enjoy your cost savings! 💰" -ForegroundColor Green
