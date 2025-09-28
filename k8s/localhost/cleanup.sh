#!/bin/bash

# Bash script to clean up AI Cookbook from local Kubernetes

echo "Cleaning up AI Cookbook deployment..."

# Delete the namespace (this will delete all resources in the namespace)
kubectl delete namespace ai-cookbook

if [ $? -eq 0 ]; then
    echo "AI Cookbook deployment cleaned up successfully!"
else
    echo "Cleanup completed (namespace may not have existed)"
fi

# Optional: Remove Docker images
read -p "Do you want to remove the Docker images? (y/N): " removeImages
if [[ $removeImages == "y" || $removeImages == "Y" ]]; then
    echo "Removing Docker images..."
    docker rmi ai-cookbook-api:latest
    docker rmi ai-cookbook-web:latest
    echo "Docker images removed!"
fi

echo "Cleanup completed!"
