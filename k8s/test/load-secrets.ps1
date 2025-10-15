# Load secrets configuration from file
function Load-SecretsConfig {
    param(
        [string]$ConfigPath = "secrets.config"
    )
    
    if (-not (Test-Path $ConfigPath)) {
        Write-Error "Secrets configuration file not found: $ConfigPath"
        Write-Host "Please copy secrets.config.example to $ConfigPath and update with your actual values" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Loading secrets configuration from: $ConfigPath" -ForegroundColor Green
    
    # Read the configuration file
    $configContent = Get-Content $ConfigPath -Raw
    
    # Parse the configuration into a hashtable
    $secrets = @{}
    $configContent -split "`n" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim().Trim('"')
                $secrets[$key] = $value
            }
        }
    }
    
    # Validate required secrets
    $requiredSecrets = @(
        "COSMOSDB_CONNECTION_STRING",
        "AZURE_CONTAINER_REGISTRY",
        "AZURE_RESOURCE_GROUP"
    )
    
    foreach ($secret in $requiredSecrets) {
        if (-not $secrets.ContainsKey($secret)) {
            Write-Error "Required secret '$secret' not found in configuration file"
            exit 1
        }
    }
    
    Write-Host "Successfully loaded secrets configuration" -ForegroundColor Green
    return $secrets
}

# Function is available for use in other scripts when this file is dot-sourced
