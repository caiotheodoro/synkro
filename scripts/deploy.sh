#!/bin/bash

# Exit on any error
set -e

echo "Building and deploying services..."

# Function to handle errors
handle_error() {
    echo "Error occurred in deployment. Getting debug information..."
    echo "Pod logs:"
    kubectl get pods
    for pod in $(kubectl get pods -l 'app in (logistics-engine,api-gateway-auth,inventory-sync)' -o jsonpath='{.items[*].metadata.name}'); do
        echo "=== Logs for $pod ==="
        kubectl logs $pod
        echo "=== Events for $pod ==="
        kubectl describe pod $pod
    done
    echo "Cleaning up..."
    ./cleanup.sh
    exit 1
}

# Set trap for error handling
trap 'handle_error' ERR

# Create necessary directories
mkdir -p ../logs

# Clean up old resources first
echo "Cleaning up old deployments..."
./cleanup.sh

# Point shell to minikube's docker-env
echo "Configuring Docker environment for Minikube..."
eval $(minikube docker-env)

# Build and deploy API Gateway Auth
echo "Building API Gateway Auth..."
cd ../api-gateway-auth
docker build -t api-gateway-auth:latest . 2>&1 | tee ../logs/api-gateway-build.log
kubectl apply -f k8s-deployment.yaml

# Build and deploy Logistics Engine
echo "Building Logistics Engine..."
cd ../logistics-engine
# Remove old image if it exists
docker rmi logistics-engine:v1 2>/dev/null || true
# Build new image with specific tag
docker build -t logistics-engine:v1 . 2>&1 | tee ../logs/logistics-engine-build.log
kubectl apply -f k8s-deployment.yaml

# Build and deploy Inventory Sync Service
echo "Building Inventory Sync Service..."
cd ../inventory-sync-service
# Remove old image if it exists
docker rmi inventory-sync:v1 2>/dev/null || true
# Build new image with specific tag
docker build -t inventory-sync:v1 . 2>&1 | tee ../logs/inventory-sync-build.log
kubectl apply -f k8s-deployment.yaml

echo "Waiting for pods to be created..."
sleep 10

echo "Checking pod status..."
kubectl get pods

echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/api-gateway-auth
kubectl wait --for=condition=available --timeout=300s deployment/logistics-engine
kubectl wait --for=condition=available --timeout=300s deployment/inventory-sync

echo "Deployments completed successfully!"

# Show final status
echo "Current deployment status:"
kubectl get pods -o wide
kubectl get services

# Reset docker environment
echo "Resetting Docker environment..."
eval $(minikube docker-env -u)

# Remove trap
trap - ERR

echo "Deployment logs are available in the logs directory" 