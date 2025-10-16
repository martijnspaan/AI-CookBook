# Meal Week Planner Deployment Guide

This guide covers deploying the Meal Week Planner application to your local Kind Kubernetes cluster using the provided Bicep templates and PowerShell deployment script.

## 🏗️ Architecture Overview

The deployment consists of:
- **Web Application**: Angular frontend served by Nginx (Port 4200)
- **API Application**: .NET 8 Web API (Port 4201)
- **Shared Storage**: Persistent volume mounted at `/shared-data`
- **Kind Cluster**: Local Kubernetes cluster with 3 nodes

## 📁 Deployment Structure

```
deploy/
├── main.bicep                 # Main Bicep template
├── main.parameters.json       # Bicep parameters
├── deployment-config.yaml     # Kubernetes configuration
└── k8s/
    ├── api-deployment.yaml    # API Kubernetes manifests
    └── web-deployment.yaml    # Web Kubernetes manifests

Update.ps1                     # Main deployment script
```

## 🚀 Quick Start

### Prerequisites
- ✅ Kind cluster running (`meal-week-planner`)
- ✅ Docker Desktop running
- ✅ kubectl configured for Kind cluster
- ✅ PowerShell execution policy set to allow scripts

### Deploy Everything
```powershell
.\Update.ps1 -Component all
```

### Deploy Individual Components
```powershell
# Deploy only the API
.\Update.ps1 -Component api

# Deploy only the Web application
.\Update.ps1 -Component web
```

## 📋 Available Commands

### Update.ps1 Script Options

| Parameter | Description | Example |
|-----------|-------------|---------|
| `-Component` | What to deploy: `all`, `web`, `api`, `clean`, `status`, `logs` | `.\Update.ps1 -Component api` |
| `-ImageTag` | Docker image tag (default: `latest`) | `.\Update.ps1 -ImageTag v1.0.0` |
| `-SkipBuild` | Skip Docker image building | `.\Update.ps1 -SkipBuild` |
| `-Force` | Force cleanup operations | `.\Update.ps1 -Component clean -Force` |

### Common Commands

```powershell
# Check deployment status
.\Update.ps1 -Component status

# View application logs
.\Update.ps1 -Component logs

# View specific component logs
.\Update.ps1 -Component logs -Component api
.\Update.ps1 -Component logs -Component web

# Clean up everything
.\Update.ps1 -Component clean

# Force clean with image removal
.\Update.ps1 -Component clean -Force
```

## 🔧 Manual Deployment Steps

If you prefer to run commands manually:

### 1. Build Docker Images
```powershell
# Build API image
docker build -t meal-week-planner-api:latest -f API/Dockerfile API/

# Build Web image
docker build -t meal-week-planner-web:latest -f Web/Dockerfile Web/
```

### 2. Load Images to Kind
```powershell
kind load docker-image meal-week-planner-api:latest --name meal-week-planner
kind load docker-image meal-week-planner-web:latest --name meal-week-planner
```

### 3. Deploy to Kubernetes
```powershell
# Apply configuration
kubectl apply -f deploy/deployment-config.yaml

# Deploy API
kubectl apply -f deploy/k8s/api-deployment.yaml

# Deploy Web
kubectl apply -f deploy/k8s/web-deployment.yaml
```

### 4. Check Status
```powershell
kubectl get pods
kubectl get services
kubectl get deployments
```

## 🌐 Accessing the Application

After successful deployment:

- **Web Application**: http://localhost:4200
- **API Service**: http://localhost:4201
- **API Health Check**: http://localhost:4201/health

## 📊 Monitoring and Troubleshooting

### Check Pod Status
```powershell
kubectl get pods -o wide
kubectl describe pod <pod-name>
```

### View Logs
```powershell
# API logs
kubectl logs -l app=meal-week-planner-api

# Web logs
kubectl logs -l app=meal-week-planner-web

# Follow logs in real-time
kubectl logs -f deployment/meal-week-planner-api
```

### Debug Issues
```powershell
# Check cluster info
kubectl cluster-info

# Check node status
kubectl get nodes

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
```

## 🔄 Development Workflow

### For API Changes
1. Make changes to API code
2. Run: `.\Update.ps1 -Component api`
3. API will be rebuilt and redeployed

### For Web Changes
1. Make changes to Web code
2. Run: `.\Update.ps1 -Component web`
3. Web app will be rebuilt and redeployed

### For Both Changes
1. Make changes to both applications
2. Run: `.\Update.ps1 -Component all`
3. Both applications will be rebuilt and redeployed

## 📁 Shared Data Storage

The applications share persistent storage at:
- **Host Path**: `E:\Kind\shared-data`
- **Container Path**: `/shared-data`

This directory is mounted in both API and Web containers for data persistence.

## 🔧 Configuration

### Environment Variables
- `ASPNETCORE_ENVIRONMENT=Development`
- `ASPNETCORE_URLS=http://+:4201`
- `API_URL=http://localhost:4201`

### Resource Limits
- **API**: 256Mi-512Mi memory, 250m-500m CPU
- **Web**: 128Mi-256Mi memory, 100m-250m CPU

### Health Checks
- **API**: `/health` endpoint
- **Web**: `/` endpoint
- Both have liveness and readiness probes

## 🚨 Troubleshooting

### Common Issues

1. **Kind cluster not found**
   ```powershell
   # Check if cluster exists
   kind get clusters
   
   # Create cluster if needed
   kind create cluster --config=kind-config.yaml
   ```

2. **Docker build fails**
   ```powershell
   # Check Docker is running
   docker version
   
   # Check Dockerfile exists
   Test-Path "API/Dockerfile"
   Test-Path "Web/Dockerfile"
   ```

3. **Images not loading to Kind**
   ```powershell
   # Check if images exist
   docker images | grep meal-week-planner
   
   # Manually load images
   kind load docker-image meal-week-planner-api:latest --name meal-week-planner
   ```

4. **Pods not starting**
   ```powershell
   # Check pod events
   kubectl describe pod <pod-name>
   
   # Check resource usage
   kubectl top pods
   ```

## 📚 Additional Resources

- [Kind Documentation](https://kind.sigs.k8s.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)

