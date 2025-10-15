# AI Cookbook - Azure Container Instances Migration

This guide explains how to migrate your AI Cookbook application from Azure Kubernetes Service (AKS) to Azure Container Instances (ACI) for significant cost savings.

## 💰 Cost Comparison

| Solution | Monthly Cost | Complexity | Best For |
|----------|-------------|------------|----------|
| **AKS (Current)** | €400 | High | Large applications |
| **ACI (New)** | €20-50 | Low | Small applications |
| **Savings** | €350-380 | - | 90% cost reduction |

## 🚀 Quick Start

### 1. Run the Simple Migration

```powershell
# Navigate to the azure directory
cd azure

# Run the simple ACI setup
.\setup-aci-simple.ps1
```

This will:
- Build and push your Docker images
- Create Azure Container Instances for API and Web
- Configure networking
- Display access URLs

### 2. Test Your Application

After deployment, you'll get URLs like:
- **Web Application**: `http://[WEB_IP]:4200`
- **API**: `http://[API_IP]:4201`
- **API Documentation**: `http://[API_IP]:4201/swagger`

## 📋 Prerequisites

- Azure CLI installed and logged in
- Docker installed and running
- Access to the `Playground - masp` Azure subscription
- Access to the `AI-CookBook` resource group

## 🛠️ Management Commands

### View Container Status
```powershell
.\manage-aci.ps1 -Action status
```

### View Logs
```powershell
# API logs
.\manage-aci.ps1 -Action logs -ContainerName ai-cookbook-api

# Web logs
.\manage-aci.ps1 -Action logs -ContainerName ai-cookbook-web
```

### Restart Containers
```powershell
# Restart API
.\manage-aci.ps1 -Action restart -ContainerName ai-cookbook-api

# Restart Web
.\manage-aci.ps1 -Action restart -ContainerName ai-cookbook-web
```

### View Access URLs
```powershell
.\manage-aci.ps1 -Action urls
```

### Cost Analysis
```powershell
.\manage-aci.ps1 -Action costs
```

## 🧹 Cleanup AKS Resources

After successful ACI migration, clean up AKS resources to avoid continued charges:

```powershell
# WARNING: This will delete all AKS resources!
.\cleanup-aks.ps1
```

## 📊 Resource Configuration

### API Container
- **CPU**: 0.5 cores
- **Memory**: 1 GB
- **Port**: 4201
- **Environment**: Production

### Web Container
- **CPU**: 0.25 cores
- **Memory**: 0.5 GB
- **Port**: 4200
- **Environment**: Production

## 🔧 Advanced Configuration

### Custom Domain and SSL

To set up a custom domain with SSL:

1. **Get your container IPs**:
   ```powershell
   .\manage-aci.ps1 -Action urls
   ```

2. **Configure DNS**:
   - Point your domain to the web container IP
   - Set up CNAME for API subdomain

3. **Set up SSL**:
   - Use Azure Application Gateway
   - Or use a reverse proxy like nginx

### Scaling

ACI doesn't support auto-scaling like AKS, but you can:

1. **Manual scaling**:
   ```powershell
   # Stop current containers
   .\manage-aci.ps1 -Action stop -ContainerName ai-cookbook-api
   
   # Deploy with more resources
   az container create --resource-group AI-CookBook --name ai-cookbook-api --image aicookbookregistry.azurecr.io/ai-cookbook-api:1.0.0-test --cpu 1 --memory 2 --ports 4201 --ip-address Public
   ```

2. **Load balancing**:
   - Deploy multiple instances
   - Use Azure Application Gateway
   - Or use Azure Load Balancer

## 📈 Monitoring

### Basic Monitoring
```powershell
# View container status
.\manage-aci.ps1 -Action status

# View logs
.\manage-aci.ps1 -Action logs -ContainerName ai-cookbook-api
```

### Advanced Monitoring
- Use Azure Monitor
- Set up Application Insights
- Configure alerts

## 🚨 Troubleshooting

### Common Issues

#### Container Won't Start
```powershell
# Check logs
.\manage-aci.ps1 -Action logs -ContainerName ai-cookbook-api

# Check container status
.\manage-aci.ps1 -Action status
```

#### Can't Access Application
```powershell
# Check URLs
.\manage-aci.ps1 -Action urls

# Check container IPs
az container show --name ai-cookbook-web --resource-group AI-CookBook --query "ipAddress.ip" -o tsv
```

#### High Costs
```powershell
# Check resource usage
.\manage-aci.ps1 -Action costs

# Review container sizes
az container list --resource-group AI-CookBook --query "[].{Name:name, CPU:containers[0].resources.requests.cpu, Memory:containers[0].resources.requests.memoryInGb}"
```

### Performance Issues

1. **Increase container resources**:
   ```powershell
   # Stop current container
   .\manage-aci.ps1 -Action stop -ContainerName ai-cookbook-api
   
   # Deploy with more resources
   az container create --resource-group AI-CookBook --name ai-cookbook-api --image aicookbookregistry.azurecr.io/ai-cookbook-api:1.0.0-test --cpu 1 --memory 2 --ports 4201 --ip-address Public
   ```

2. **Check resource limits**:
   ```powershell
   az container show --name ai-cookbook-api --resource-group AI-CookBook --query "containers[0].resources"
   ```

## 🔄 Migration Back to AKS

If you need to migrate back to AKS:

1. **Keep your AKS configuration files** in the `k8s/` directory
2. **Run the AKS deployment script**:
   ```powershell
   cd k8s/test
   .\deploy-test.ps1
   ```
3. **Clean up ACI resources**:
   ```powershell
   .\manage-aci.ps1 -Action delete -ContainerName ai-cookbook-api
   .\manage-aci.ps1 -Action delete -ContainerName ai-cookbook-web
   ```

## 📚 Additional Resources

- [Azure Container Instances Documentation](https://docs.microsoft.com/en-us/azure/container-instances/)
- [ACI Pricing](https://azure.microsoft.com/en-us/pricing/details/container-instances/)
- [ACI Best Practices](https://docs.microsoft.com/en-us/azure/container-instances/container-instances-best-practices)

## 🎉 Benefits of ACI Migration

✅ **90% cost reduction** (€400 → €20-50/month)  
✅ **Simplified management** (no Kubernetes complexity)  
✅ **Faster deployment** (no cluster provisioning)  
✅ **Pay-per-use** (only pay when containers are running)  
✅ **Easy scaling** (manual scaling when needed)  
✅ **Same functionality** (your application works identically)  

## 💡 Tips for Success

1. **Start with the simple setup** - Use `setup-aci-simple.ps1` first
2. **Test thoroughly** - Verify all functionality works
3. **Monitor costs** - Use `manage-aci.ps1 -Action costs` regularly
4. **Clean up AKS** - Don't forget to delete AKS resources
5. **Keep backups** - Save your AKS configuration files

Your AI Cookbook will run exactly the same on ACI as it did on AKS, but at a fraction of the cost! 🚀💰
