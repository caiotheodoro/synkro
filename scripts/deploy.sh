#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment process..."

if ! minikube status &>/dev/null; then
    minikube start
else
    echo "Minikube is already running."
fi

# Function to handle errors
handle_error() {
    echo "Error occurred in deployment. Getting debug information..."
    echo "Pod logs:"
    kubectl get pods
    for pod in $(kubectl get pods -l 'app in (logistics-engine,api-gateway-auth,inventory-sync,ai-ml-predictions,notification-service)' -o jsonpath='{.items[*].metadata.name}'); do
        echo "=== Logs for $pod ==="
        kubectl logs $pod
        echo "=== Events for $pod ==="
        kubectl describe pod $pod
    done
    echo "Cleaning up..."
    ./cleanup.sh
    exit 1
}

# Function to wait for deployment
wait_for_deployment() {
    local deployment=$1
    local timeout=${2:-300s}
    echo "Waiting for deployment $deployment to be ready..."
    kubectl wait --for=condition=available --timeout=$timeout deployment/$deployment || {
        echo "Deployment $deployment failed to become ready within $timeout"
        return 1
    }
}

# Function to build and deploy a service
deploy_service() {
    local service_dir=$1
    local service_name=${2:-$(basename $service_dir)}
    local version=${3:-v1}
    echo "Building and deploying $service_name from $service_dir..."
    
    cd ../$service_dir
    
    # Remove old image if it exists
    docker rmi $service_name:$version 2>/dev/null || true
    
    # Build new image
    docker build -t $service_name:$version . 2>&1 | tee ../logs/$service_name-build.log
    
    # Apply k8s configuration
    kubectl apply -f k8s-deployment.yaml
    
    # Wait for deployment
    wait_for_deployment $service_name
    
    cd ../scripts
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

# Define services with their directory and deployment names
declare -A services=(
    ["api-gateway-auth"]="api-gateway-auth"
    ["logistics-engine"]="logistics-engine"
    ["inventory-sync-service"]="inventory-sync"
    ["ai-ml-predictions"]="ai-ml-predictions"
    ["notification-service"]="notification-service"
)

# Deploy all services
for service_dir in "${!services[@]}"; do
    service_name="${services[$service_dir]}"
    deploy_service "$service_dir" "$service_name"
done

echo "Waiting for all services to be ready..."
sleep 10

echo "Verifying all deployments..."
kubectl get pods
kubectl get services

# Perform basic health checks
echo "Performing health checks..."
for service_name in "${services[@]}"; do
    echo "Checking $service_name health endpoint..."
    # Get the service port
    port=$(kubectl get service $service_name -o jsonpath='{.spec.ports[0].port}')
    # Forward the port temporarily
    kubectl port-forward service/$service_name $port:$port >/dev/null 2>&1 &
    forward_pid=$!
    sleep 2
    # Try the health check
    curl -s http://localhost:$port/health || echo "Failed to reach $service_name health endpoint"
    # Kill the port forward
    kill $forward_pid 2>/dev/null || true
    wait $forward_pid 2>/dev/null || true
done

# Reset docker environment
echo "Resetting Docker environment..."
eval $(minikube docker-env -u)

# Remove trap
trap - ERR

echo "Deployment completed successfully!"
echo "Current deployment status:"
kubectl get pods -o wide
kubectl get services

echo "Deployment logs are available in the logs directory" 