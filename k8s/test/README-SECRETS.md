# Secrets Configuration Setup

This directory contains deployment scripts that require sensitive configuration information such as database connection strings and Azure credentials. To maintain security and prevent secrets from being committed to the git repository, these values are stored in a separate configuration file.

## Setup Instructions

### 1. Create Secrets Configuration File

Copy the example configuration file and update it with your actual values:

```bash
cp secrets.config.example secrets.config
```

### 2. Update Configuration Values

Edit `secrets.config` and replace the placeholder values with your actual configuration:

```bash
# CosmosDB Configuration
COSMOSDB_CONNECTION_STRING="AccountEndpoint=https://your-cosmosdb.documents.azure.com:443/;AccountKey=YOUR_ACTUAL_ACCOUNT_KEY_HERE;"

# Azure Container Registry Configuration
AZURE_CONTAINER_REGISTRY="your-registry.azurecr.io"
AZURE_CONTAINER_REGISTRY_USERNAME="your-registry-username"

# Azure Resource Configuration
AZURE_RESOURCE_GROUP="your-resource-group"
AZURE_LOCATION="westeurope"

# Container Configuration
CONTAINER_GROUP_NAME="ai-cookbook-unified"
API_CONTAINER_NAME="ai-cookbook-api"
WEB_CONTAINER_NAME="ai-cookbook-web"
```

### 3. Security Notes

- **Never commit `secrets.config` to git** - it's already added to `.gitignore`
- **Keep your secrets secure** - treat this file like a password
- **Use different configurations** for different environments (dev, test, prod)
- **Rotate secrets regularly** for security best practices

### 4. File Structure

- `secrets.config.example` - Template file (safe to commit)
- `secrets.config` - Your actual secrets (ignored by git)
- `load-secrets.ps1` - PowerShell helper to load configuration
- `.gitignore` - Excludes `secrets.config` from version control

### 5. Usage in Scripts

All deployment scripts automatically load the secrets configuration:

```powershell
# The scripts will automatically load from secrets.config
.\deploy-unified-test.ps1
.\deploy-test.ps1
.\update-test.ps1

# Or specify a custom config file
.\deploy-unified-test.ps1 -ConfigPath "my-custom-secrets.config"
```

### 6. Troubleshooting

If you get an error about missing secrets configuration:

1. Ensure `secrets.config` exists in the current directory
2. Verify all required secrets are present in the file
3. Check that the file format is correct (key=value pairs)
4. Make sure there are no syntax errors in the configuration

### 7. Required Secrets

The following secrets are required for deployment:

- `COSMOSDB_CONNECTION_STRING` - Azure CosmosDB connection string
- `AZURE_CONTAINER_REGISTRY` - Azure Container Registry URL
- `AZURE_RESOURCE_GROUP` - Azure resource group name

Optional secrets (have defaults):
- `AZURE_LOCATION` - Azure region (default: westeurope)
- `CONTAINER_GROUP_NAME` - Container group name (default: ai-cookbook-unified)
- `API_CONTAINER_NAME` - API container name (default: ai-cookbook-api)
- `WEB_CONTAINER_NAME` - Web container name (default: ai-cookbook-web)
