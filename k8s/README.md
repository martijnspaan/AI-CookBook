# AI Cookbook Kubernetes Setup

This directory contains all the necessary Kubernetes configurations to run the AI Cookbook application locally using Docker Desktop with Kubernetes enabled.

## Prerequisites

1. **Docker Desktop for Windows** - Installed and running with Kubernetes enabled
2. **kubectl** - Kubernetes command-line tool
3. **CosmosDB** - Azure Cosmos DB instance (for production) or local emulator

## Quick Start

### Option 1: Using PowerShell (Windows)

```powershell
# Navigate to the k8s directory
cd k8s

# Deploy the application
.\deploy-local.ps1

# Clean up when done
.\cleanup.ps1
```

### Option 2: Using Bash (Linux/macOS/WSL)

```bash
# Navigate to the k8s directory
cd k8s

# Deploy the application
./deploy-local.sh

# Clean up when done
./cleanup.sh
```

### Option 3: Using Docker Compose (Alternative)

```bash
# From the project root
docker-compose up --build
```

## Configuration

### Environment Variables

The application uses the following environment variables (configured in `configmap.yaml`):

- **API Configuration**: Title, version, description, contact info
- **CORS Settings**: Allowed origins, methods, and headers
- **Swagger Settings**: Documentation configuration
- **CosmosDB Settings**: Database and container names

### Secrets

Update the `secret.yaml` file with your actual CosmosDB connection string:

```yaml
data:
  COSMOSDB_CONNECTION_STRING: "your-base64-encoded-connection-string"
```

To encode your connection string:
```bash
echo -n "your-connection-string" | base64
```

## Architecture

The Kubernetes setup includes:

### Namespace
- `ai-cookbook` - Isolates all application resources

### API Service
- **Deployment**: `api-deployment` - Runs the .NET API application
- **Service**: `api-service` - Exposes the API on port 4201
- **Port**: 4201 (as specified in requirements)

### Web Service
- **Deployment**: `web-deployment` - Runs the Angular web application with Nginx
- **Service**: `web-service` - Exposes the web app on port 4200
- **Port**: 4200 (as specified in requirements)

### Configuration
- **ConfigMap**: `ai-cookbook-config` - Application configuration
- **Secret**: `ai-cookbook-secrets` - Sensitive data (CosmosDB connection)

### Ingress
- **Ingress**: `ai-cookbook-ingress` - Routes traffic to appropriate services
- **Web**: `http://localhost/` → web-service:4200
- **API**: `http://localhost/api` → api-service:4201

## Access Points

After deployment, the application will be available at:

- **Web Application**: http://localhost:4200
- **API**: http://localhost:4201
- **API Swagger Documentation**: http://localhost:4201/swagger

## Monitoring and Debugging

### Check Pod Status
```bash
kubectl get pods -n ai-cookbook
```

### View Logs
```bash
# API logs
kubectl logs -f deployment/api-deployment -n ai-cookbook

# Web logs
kubectl logs -f deployment/web-deployment -n ai-cookbook
```

### Check Services
```bash
kubectl get services -n ai-cookbook
```

### Describe Resources
```bash
kubectl describe deployment api-deployment -n ai-cookbook
kubectl describe deployment web-deployment -n ai-cookbook
```

## Troubleshooting

### Common Issues

1. **Images not found**: Make sure Docker images are built locally
   ```bash
   docker images | grep ai-cookbook
   ```

2. **Pods not starting**: Check pod logs and events
   ```bash
   kubectl describe pod <pod-name> -n ai-cookbook
   ```

3. **Connection issues**: Verify services are running and ports are correct

4. **CosmosDB connection**: Ensure the connection string in the secret is correct

### Cleanup

To completely remove the deployment:

```bash
kubectl delete namespace ai-cookbook
```

## Development Notes

- Images are built with `imagePullPolicy: Never` for local development
- The web application includes Nginx configuration for API proxying
- CORS is configured to allow localhost origins
- Resource limits are set for both CPU and memory

## File Structure

```
k8s/
├── namespace.yaml          # Namespace definition
├── configmap.yaml          # Application configuration
├── secret.yaml             # Sensitive data (CosmosDB)
├── api-deployment.yaml     # API deployment
├── api-service.yaml        # API service
├── web-deployment.yaml     # Web deployment
├── web-service.yaml        # Web service
├── ingress.yaml            # Ingress configuration
├── deploy-local.ps1        # PowerShell deployment script
├── deploy-local.sh         # Bash deployment script
├── cleanup.ps1             # PowerShell cleanup script
├── cleanup.sh              # Bash cleanup script
└── README.md               # This file
```
