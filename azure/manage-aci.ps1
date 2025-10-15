# PowerShell script to manage AI Cookbook on Azure Container Instances

param(
    [string]$ResourceGroup = "rg-martijn",
    [string]$Action = "status",
    [string]$ContainerName = "",
    [string]$SubscriptionName = "XPRTZ Playground"
)

Write-Host "AI Cookbook ACI Management Tool" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "Action: $Action" -ForegroundColor Yellow

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

switch ($Action.ToLower()) {
    "status" {
        Write-Host "`n=== Container Status ===" -ForegroundColor Green
        az container list --resource-group $ResourceGroup --query "[].{Name:name, Status:instanceView.state, IP:ipAddress.ip, CPU:containers[0].resources.requests.cpu, Memory:containers[0].resources.requests.memoryInGb}" --output table
    }
    
    "logs" {
        if (-not $ContainerName) {
            Write-Error "Container name is required for logs action. Use -ContainerName parameter."
            exit 1
        }
        Write-Host "`n=== Logs for $ContainerName ===" -ForegroundColor Green
        az container logs --name $ContainerName --resource-group $ResourceGroup
    }
    
    "restart" {
        if (-not $ContainerName) {
            Write-Error "Container name is required for restart action. Use -ContainerName parameter."
            exit 1
        }
        Write-Host "`n=== Restarting $ContainerName ===" -ForegroundColor Green
        az container restart --name $ContainerName --resource-group $ResourceGroup
        Write-Host "Container $ContainerName restarted successfully!" -ForegroundColor Green
    }
    
    "stop" {
        if (-not $ContainerName) {
            Write-Error "Container name is required for stop action. Use -ContainerName parameter."
            exit 1
        }
        Write-Host "`n=== Stopping $ContainerName ===" -ForegroundColor Green
        az container stop --name $ContainerName --resource-group $ResourceGroup
        Write-Host "Container $ContainerName stopped successfully!" -ForegroundColor Green
    }
    
    "start" {
        if (-not $ContainerName) {
            Write-Error "Container name is required for start action. Use -ContainerName parameter."
            exit 1
        }
        Write-Host "`n=== Starting $ContainerName ===" -ForegroundColor Green
        az container start --name $ContainerName --resource-group $ResourceGroup
        Write-Host "Container $ContainerName started successfully!" -ForegroundColor Green
    }
    
    "delete" {
        if (-not $ContainerName) {
            Write-Error "Container name is required for delete action. Use -ContainerName parameter."
            exit 1
        }
        Write-Host "`n=== Deleting $ContainerName ===" -ForegroundColor Red
        $confirm = Read-Host "Are you sure you want to delete $ContainerName? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            az container delete --name $ContainerName --resource-group $ResourceGroup --yes
            Write-Host "Container $ContainerName deleted successfully!" -ForegroundColor Green
        } else {
            Write-Host "Delete cancelled." -ForegroundColor Yellow
        }
    }
    
    "costs" {
        Write-Host "`n=== Cost Analysis ===" -ForegroundColor Green
        Write-Host "Current ACI Resources:" -ForegroundColor Yellow
        az container list --resource-group $ResourceGroup --query "[].{Name:name, CPU:containers[0].resources.requests.cpu, Memory:containers[0].resources.requests.memoryInGb, Status:instanceView.state}" --output table
        
        Write-Host "`nEstimated Monthly Costs:" -ForegroundColor Yellow
        Write-Host "  API Container (0.5 CPU, 1GB RAM): ~€15-25/month" -ForegroundColor White
        Write-Host "  Web Container (0.25 CPU, 0.5GB RAM): ~€8-15/month" -ForegroundColor White
        Write-Host "  Total Estimated Cost: ~€23-40/month" -ForegroundColor Green
        Write-Host "  Previous AKS Cost: ~€400/month" -ForegroundColor Red
        Write-Host "  Monthly Savings: ~€360-377" -ForegroundColor Green
    }
    
    "urls" {
        Write-Host "`n=== Access URLs ===" -ForegroundColor Green
        $apiIP = az container show --name "ai-cookbook-api" --resource-group $ResourceGroup --query "ipAddress.ip" -o tsv 2>$null
        $webIP = az container show --name "ai-cookbook-web" --resource-group $ResourceGroup --query "ipAddress.ip" -o tsv 2>$null
        
        if ($apiIP) {
            Write-Host "  API: http://$apiIP:4201" -ForegroundColor White
            Write-Host "  API Documentation: http://$apiIP:4201/swagger" -ForegroundColor White
        } else {
            Write-Host "  API: Not running" -ForegroundColor Red
        }
        
        if ($webIP) {
            Write-Host "  Web Application: http://$webIP:4200" -ForegroundColor White
        } else {
            Write-Host "  Web Application: Not running" -ForegroundColor Red
        }
    }
    
    "help" {
        Write-Host "`n=== Available Actions ===" -ForegroundColor Green
        Write-Host "  status     - Show status of all containers" -ForegroundColor White
        Write-Host "  logs       - Show logs for a specific container" -ForegroundColor White
        Write-Host "  restart    - Restart a specific container" -ForegroundColor White
        Write-Host "  stop       - Stop a specific container" -ForegroundColor White
        Write-Host "  start      - Start a specific container" -ForegroundColor White
        Write-Host "  delete     - Delete a specific container" -ForegroundColor White
        Write-Host "  costs      - Show cost analysis" -ForegroundColor White
        Write-Host "  urls       - Show access URLs" -ForegroundColor White
        Write-Host "  help       - Show this help message" -ForegroundColor White
        
        Write-Host "`n=== Examples ===" -ForegroundColor Yellow
        Write-Host "  .\manage-aci.ps1 -Action status" -ForegroundColor White
        Write-Host "  .\manage-aci.ps1 -Action logs -ContainerName ai-cookbook-api" -ForegroundColor White
        Write-Host "  .\manage-aci.ps1 -Action restart -ContainerName ai-cookbook-web" -ForegroundColor White
        Write-Host "  .\manage-aci.ps1 -Action costs" -ForegroundColor White
        Write-Host "  .\manage-aci.ps1 -Action urls" -ForegroundColor White
    }
    
    default {
        Write-Error "Unknown action: $Action. Use 'help' to see available actions."
        exit 1
    }
}
