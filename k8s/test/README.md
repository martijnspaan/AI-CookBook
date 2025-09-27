# AI Cookbook Test Environment

This directory contains Kubernetes manifests and deployment scripts for the AI Cookbook test environment on Azure Kubernetes Service (AKS).

## Prerequisites

- Azure CLI installed and configured
- kubectl installed
- Docker installed
- Access to Azure Container Registry
- AKS cluster with NGINX Ingress Controller

## Quick Start

### 1. Set up Azure Resources (First time only)

```powershell
# Run the setup script to create Azure resources
./setup-azure-resources.ps1
```

This will create:
- Resource Group
- Azure Container Registry
- AKS Cluster
- Install NGINX Ingress Controller

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

## Manual Deployment

If you prefer to deploy manually:

```powershell
# Apply all manifests at once
kubectl apply -f deploy-all-test.yaml

# Or apply individual components
kubectl apply -f namespace-test.yaml
kubectl apply -f rbac-test.yaml
kubectl apply -f configmap-test.yaml
kubectl apply -f secret-test.yaml
kubectl apply -f tls-secret-test.yaml
kubectl apply -f api-deployment-test.yaml
kubectl apply -f api-service-test.yaml
kubectl apply -f web-deployment-test.yaml
kubectl apply -f web-service-test.yaml
kubectl apply -f pod-disruption-budget-test.yaml
kubectl apply -f network-policy-test.yaml
kubectl apply -f ingress-test.yaml
```

## Configuration

### Environment Variables

The test environment uses the following configuration:

- **Namespace**: `ai-cookbook-test`
- **Environment**: `Test`
- **Log Level**: `Debug` (more verbose logging)
- **Database**: `CookBookTest` (separate from production)
- **CORS**: Configured for Azure domains

### Secrets

Before deploying, update the following secrets:

1. **CosmosDB Connection String** in `secret-test.yaml`
2. **TLS Certificate** in `tls-secret-test.yaml`

### Image Configuration

The deployment scripts expect images to be available in Azure Container Registry:
- `ai-cookbook-api:1.0.0-test`
- `ai-cookbook-web:1.0.0-test`

## Access URLs

After deployment, the application will be available at:

- **Web Application**: `https://ai-cookbook-test.westeurope.cloudapp.azure.com`
- **API**: `https://ai-cookbook-test.westeurope.cloudapp.azure.com/api`
- **API Swagger**: `https://ai-cookbook-test.westeurope.cloudapp.azure.com/api/swagger`
- **Alternative URL**: `https://k8s-ai-cookbook-dns-e3byex43.hcp.westeurope.azmk8s.io`

## Monitoring

### Check Deployment Status

```powershell
# Check pods
kubectl get pods -n ai-cookbook-test

# Check services
kubectl get services -n ai-cookbook-test

# Check ingress
kubectl get ingress -n ai-cookbook-test
```

### View Logs

```powershell
# API logs
kubectl logs -f deployment/api-deployment-test -n ai-cookbook-test

# Web logs
kubectl logs -f deployment/web-deployment-test -n ai-cookbook-test
```

### Health Checks

```powershell
# Check API health
kubectl get pods -n ai-cookbook-test -l app=api

# Check Web health
kubectl get pods -n ai-cookbook-test -l app=web
```

## Troubleshooting

### Common Issues

1. **Image Pull Errors**: Ensure images are pushed to Azure Container Registry
2. **Ingress Issues**: Verify NGINX Ingress Controller is installed and running
3. **Secret Issues**: Check that secrets are properly base64 encoded
4. **Network Issues**: Verify network policies allow required traffic

### Debug Commands

```powershell
# Describe deployment
kubectl describe deployment api-deployment-test -n ai-cookbook-test

# Check events
kubectl get events -n ai-cookbook-test --sort-by='.lastTimestamp'

# Check ingress controller
kubectl get pods -n ingress-nginx
```

## Security Considerations

- All secrets should be managed through Azure Key Vault in production
- TLS certificates should be properly configured
- Network policies restrict traffic between namespaces
- Pod security contexts enforce non-root execution

## Cost Optimization

- Use appropriate node sizes for test environment
- Consider using spot instances for non-critical workloads
- Monitor resource usage and adjust limits accordingly
- Clean up test environments when not in use
