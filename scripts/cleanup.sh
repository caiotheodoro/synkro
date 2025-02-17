#!/bin/bash

echo "Cleaning up deployments..."

# Point shell to minikube's docker-env
eval $(minikube docker-env)

# Function to safely delete k8s resources
safe_delete() {
    local resource_type=$1
    local resource_name=$2
    
    if kubectl get $resource_type $resource_name &>/dev/null; then
        echo "Deleting $resource_type/$resource_name..."
        kubectl delete $resource_type $resource_name --timeout=60s
        if [ $? -ne 0 ]; then
            echo "Warning: Failed to delete $resource_type/$resource_name gracefully, forcing deletion..."
            kubectl delete $resource_type $resource_name --force --grace-period=0
        fi
    else
        echo "$resource_type/$resource_name not found, skipping..."
    fi
}

# Delete deployments
safe_delete deployment logistics-engine
safe_delete deployment api-gateway-auth

# Delete services
safe_delete service logistics-engine
safe_delete service api-gateway-auth

# Clean up docker images
echo "Cleaning up Docker images..."
docker rmi logistics-engine:v1 2>/dev/null || true
docker rmi api-gateway-auth:latest 2>/dev/null || true

# Reset docker environment
eval $(minikube docker-env -u)

echo "Cleanup completed!" 