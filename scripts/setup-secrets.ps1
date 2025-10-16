# Setup Secrets Script for Meal Week Planner
# This script reads secrets from secrets.env and creates Kubernetes secrets

param(
    [Parameter(Mandatory=$false)]
    [string]$ClusterName = "meal-week-planner"
)

$ErrorActionPreference = "Stop"

# Colors for output
$RED = "Red"
$GREEN = "Green"
$YELLOW = "Yellow"
$BLUE = "Cyan"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-ColorOutput "Checking prerequisites..." $BLUE
    
    # Check if secrets.env exists
    if (-not (Test-Path "secrets.env")) {
        Write-ColorOutput "ERROR: secrets.env file not found. Please create it with your secrets." $RED
        exit 1
    }
    
    # Check if kubectl is configured
    $kubectlContext = kubectl config current-context
    if ($kubectlContext -ne "kind-$ClusterName") {
        Write-ColorOutput "WARNING: Setting kubectl context to kind-$ClusterName" $YELLOW
        kubectl config use-context "kind-$ClusterName"
    }
    
    Write-ColorOutput "Prerequisites check passed" $GREEN
}

function Convert-ToBase64 {
    param([string]$Value)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
    return [System.Convert]::ToBase64String($bytes)
}

function Create-KubernetesSecret {
    Write-ColorOutput "Creating Kubernetes secret from secrets.env..." $BLUE
    
    # Read secrets from env file
    $secrets = @{}
    Get-Content "secrets.env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $secrets[$key] = $value
        }
    }
    
    # Create secret manifest
    $secretYaml = @"
apiVersion: v1
kind: Secret
metadata:
  name: meal-week-planner-secrets
  namespace: default
type: Opaque
data:
  cosmosdb-connection-string: $(Convert-ToBase64 $secrets["COSMOSDB_CONNECTION_STRING"])
  cosmosdb-database-name: $(Convert-ToBase64 $secrets["COSMOSDB_DATABASE_NAME"])
  cosmosdb-partition-key-path: $(Convert-ToBase64 $secrets["COSMOSDB_PARTITION_KEY_PATH"])
"@
    
    # Apply the secret
    $secretYaml | kubectl apply -f -
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "Successfully created Kubernetes secret" $GREEN
    } else {
        Write-ColorOutput "ERROR: Failed to create Kubernetes secret" $RED
        exit 1
    }
}

function Show-SecretStatus {
    Write-ColorOutput "`nSecret Status:" $BLUE
    kubectl get secret meal-week-planner-secrets -o yaml | Select-String "name:|namespace:"
    
    Write-ColorOutput "`nTo view secret keys (base64 encoded):" $YELLOW
    Write-ColorOutput "kubectl get secret meal-week-planner-secrets -o jsonpath='{.data}'" $YELLOW
}

# Main execution
Write-ColorOutput "Meal Week Planner Secrets Setup" $BLUE
Write-ColorOutput "=================================" $BLUE

Test-Prerequisites
Create-KubernetesSecret
Show-SecretStatus

Write-ColorOutput "`nSecrets setup completed successfully!" $GREEN
Write-ColorOutput "You can now deploy the application using the Update.ps1 script." $GREEN
