#!/bin/bash

# Bash script to deploy AI Cookbook to local Kubernetes
# Prerequisites: Docker Desktop with Kubernetes enabled, kubectl

echo "Starting AI Cookbook local deployment..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed or not in PATH"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Error: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Build Docker images
echo "Building Docker images..."

# Change to project root directory
ORIGINAL_DIR=$(pwd)
cd ..

# Build API image
echo "Building API image..."
docker build -t ai-cookbook-api:latest -f API/API.Application/Dockerfile API/

if [ $? -ne 0 ]; then
    echo "Error: Failed to build API image"
    cd "$ORIGINAL_DIR"
    exit 1
fi

# Build Web image
echo "Building Web image..."
docker build -t ai-cookbook-web:latest -f Web/Dockerfile Web/

if [ $? -ne 0 ]; then
    echo "Error: Failed to build Web image"
    cd "$ORIGINAL_DIR"
    exit 1
fi

# Return to k8s directory
cd "$ORIGINAL_DIR"

echo "Docker images built successfully!"

# Apply Kubernetes manifests
echo "Applying Kubernetes manifests..."

# Create namespace
kubectl apply -f namespace.yaml

# Apply ConfigMap
kubectl apply -f configmap.yaml

# Apply Secret (you may need to update the connection string)
kubectl apply -f secret.yaml

# Apply API resources
kubectl apply -f api-deployment.yaml
kubectl apply -f api-service.yaml

# Apply Web resources
kubectl apply -f web-deployment.yaml
kubectl apply -f web-service.yaml

# Apply Ingress
kubectl apply -f ingress.yaml

echo "Kubernetes manifests applied successfully!"

# Wait for deployments to be ready
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/api-deployment -n ai-cookbook
kubectl wait --for=condition=available --timeout=300s deployment/web-deployment -n ai-cookbook

# Get service information
echo "Deployment completed! Service information:"
kubectl get services -n ai-cookbook
kubectl get pods -n ai-cookbook

echo ""
echo "To access the application:"
echo "Web application: http://localhost:4200"
echo "API: http://localhost:4201"
echo "API Swagger: http://localhost:4201/swagger"

echo ""
echo "To check logs:"
echo "API logs: kubectl logs -f deployment/api-deployment -n ai-cookbook"
echo "Web logs: kubectl logs -f deployment/web-deployment -n ai-cookbook"

echo ""
echo "To delete the deployment:"
echo "kubectl delete namespace ai-cookbook"
