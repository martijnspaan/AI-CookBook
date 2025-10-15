# AI Cookbook Test Environment

This directory contains deployment scripts for the AI Cookbook test environment on Azure Container Instances (ACI) in the rg-martijn resource group.

## Prerequisites

- Azure CLI installed and configured
- Docker installed
- Access to Azure Container Registry (aicookbookmartijn.azurecr.io)
- Existing Azure Container Instances in rg-martijn resource group

## Quick Start

### 1. Set up Azure Resources (First time only)

```powershell
# Run the setup script to create Azure resources
./setup-azure-resources.ps1
```

This will verify and set up:
- Resource Group (rg-martijn)
- Azure Container Registry (aicookbookmartijn)
- Azure Container Instances (ai-cookbook-api, ai-cookbook-web)

### 2. Deploy to Test Environment

```powershell
# Deploy the application to test environment
./deploy-test.ps1
```

### 3. Clean up Test Environment

```powershell
# Remove the test environment
./cleanup-test.ps1
```

## Manual Container Updates

If you prefer to update containers manually:

```powershell
# Update API container with new image
az container create --resource-group rg-martijn --name ai-cookbook-api --image aicookbookmartijn.azurecr.io/ai-cookbook-api:1.0.0-test --registry-login-server aicookbookmartijn.azurecr.io --registry-username <username> --registry-password <password> --ports 4201 --ip-address Public --cpu 1 --memory 2 --restart-policy Always

# Update Web container with new image
az container create --resource-group rg-martijn --name ai-cookbook-web --image aicookbookmartijn.azurecr.io/ai-cookbook-web:1.0.0-test --registry-login-server aicookbookmartijn.azurecr.io --registry-username <username> --registry-password <password> --ports 80 --ip-address Public --cpu 1 --memory 1 --restart-policy Always
```

## Configuration

### Environment Variables

The test environment uses the following configuration:

- **Resource Group**: `rg-martijn`
- **Environment**: `Test`
- **Log Level**: `Debug` (more verbose logging)
- **Database**: `CookBook` (CosmosDB in rg-martijn)
- **CORS**: Configured for ACI IP addresses and localhost

### Image Configuration

The deployment scripts expect images to be available in Azure Container Registry:
- `aicookbookmartijn.azurecr.io/ai-cookbook-api:1.0.0-test`
- `aicookbookmartijn.azurecr.io/ai-cookbook-web:1.0.0-test`

### Container Configuration

The containers are configured in a unified deployment with:
- **API Container**: 1 CPU, 2GB RAM, Port 4201
- **Web Container**: 1 CPU, 1GB RAM, Port 80
- **Shared IP Address**: Both containers use the same public IP
- **Restart Policy**: Always
- **Total Resources**: 2 CPU, 3GB RAM

## Access URLs

After deployment, the application will be available at:

- **Web Application**: `http://20.56.205.169`
- **API**: `http://20.56.205.169:4201`
- **API Swagger**: `http://20.56.205.169:4201/swagger`

Note: Both containers share the same IP address in the unified deployment. IP addresses may change when containers are recreated. Check the deployment output for current IPs.

## Monitoring

### Check Deployment Status

```powershell
# Check unified container group
az container show --resource-group rg-martijn --name ai-cookbook-unified --query "{name:name, state:properties.instanceView.state, ip:properties.ipAddress.ip, containers:properties.containers[].{name:name, state:properties.instanceView.currentState.state}}" -o table

# Check specific containers within the group
az container show --resource-group rg-martijn --name ai-cookbook-unified --query "properties.containers[].{name:name, state:properties.instanceView.currentState.state, restartCount:properties.instanceView.restartCount}" -o table
```

### View Logs

```powershell
# API logs
az container logs --resource-group rg-martijn --name ai-cookbook-unified --container-name ai-cookbook-api

# Web logs
az container logs --resource-group rg-martijn --name ai-cookbook-unified --container-name ai-cookbook-web
```

### Health Checks

```powershell
# Check API container status
az container show --resource-group rg-martijn --name ai-cookbook-unified --query "properties.containers[?name=='ai-cookbook-api'].properties.instanceView.currentState" -o table

# Check Web container status
az container show --resource-group rg-martijn --name ai-cookbook-unified --query "properties.containers[?name=='ai-cookbook-web'].properties.instanceView.currentState" -o table
```

## Troubleshooting

### Common Issues

1. **Image Pull Errors**: Ensure images are pushed to Azure Container Registry
2. **Container Start Issues**: Check container logs for startup errors
3. **Network Issues**: Verify containers have public IP addresses
4. **Authentication Issues**: Ensure ACR credentials are correct

### Debug Commands

```powershell
# Check container events for API
az container show --resource-group rg-martijn --name ai-cookbook-unified --query "properties.containers[?name=='ai-cookbook-api'].properties.instanceView.events" -o table

# Check container events for Web
az container show --resource-group rg-martijn --name ai-cookbook-unified --query "properties.containers[?name=='ai-cookbook-web'].properties.instanceView.events" -o table

# Check container logs with timestamps
az container logs --resource-group rg-martijn --name ai-cookbook-unified --container-name ai-cookbook-api --follow

# Restart unified container group
az container restart --resource-group rg-martijn --name ai-cookbook-unified
```

## Security Considerations

- All secrets should be managed through Azure Key Vault in production
- Container images should be scanned for vulnerabilities
- Network access is restricted to specific IP addresses
- Containers run with minimal required permissions

## Cost Optimization

- Use appropriate container sizes for test environment (1 CPU, 1-2GB RAM)
- Containers automatically scale based on demand
- Monitor resource usage and adjust limits accordingly
- Clean up test environments when not in use
- Consider using Azure Container Instances for cost-effective testing
