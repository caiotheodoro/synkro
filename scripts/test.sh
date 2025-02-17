#!/bin/bash

# Exit on any error
set -e

# Function to cleanup port-forwards
cleanup() {
    echo "Cleaning up port-forwards..."
    if [ ! -z "$LOGISTICS_PF_PID" ]; then
        kill $LOGISTICS_PF_PID 2>/dev/null || true
    fi
    if [ ! -z "$AUTH_PF_PID" ]; then
        kill $AUTH_PF_PID 2>/dev/null || true
    fi
}

# Set trap for cleanup
trap cleanup EXIT

echo "Starting service tests..."

# Load configuration
CONFIG_FILE="test-config.yaml"
if [ -f "$CONFIG_FILE" ]; then
    eval $(parse_yaml $CONFIG_FILE)
else
    echo "Configuration file not found!"
    exit 1
fi

# Setup port-forwards in background
echo "Setting up port-forwards..."
kubectl port-forward service/logistics-engine 3000:3000 &
LOGISTICS_PF_PID=$!

kubectl port-forward service/api-gateway-auth 3001:3000 &
AUTH_PF_PID=$!

# Wait for port-forwards to be ready
echo "Waiting for services to be available..."
sleep 3

# Test logistics-engine health endpoint
echo -e "\nTesting logistics-engine endpoints..."
echo "Testing health endpoint..."
LOGISTICS_HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if [ "$LOGISTICS_HEALTH_RESPONSE" = "OK" ]; then
    echo "✅ Logistics health check passed!"
else
    echo "❌ Logistics health check failed! Response: $LOGISTICS_HEALTH_RESPONSE"
    exit 1
fi

# Test api-gateway-auth endpoints
echo -e "\nTesting api-gateway-auth endpoints..."
echo "Testing health endpoint..."
AUTH_HEALTH_RESPONSE=$(curl -s http://localhost:3001/auth/health)
if [ "$AUTH_HEALTH_RESPONSE" = "OK" ]; then
    echo "✅ Auth health check passed!"
else
    echo "❌ Auth health check failed! Response: $AUTH_HEALTH_RESPONSE"
    exit 1
fi

# Test auth endpoints (adjust these based on your actual endpoints)
echo "Testing auth endpoints..."

# Register test user
echo "Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/register \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "test123",
        "name": "Test User"
    }')

if [[ $REGISTER_RESPONSE == *"success"* ]]; then
    echo "✅ User registration successful!"
else
    echo "❌ User registration failed! Response: $REGISTER_RESPONSE"
    exit 1
fi

# Login test
echo "Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "test123"
    }')

if [[ $LOGIN_RESPONSE == *"token"* ]]; then
    echo "✅ User login successful!"
    # Extract token for further tests
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
    echo "❌ User login failed! Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test protected endpoint
if [ ! -z "$TOKEN" ]; then
    echo "Testing protected endpoint..."
    PROTECTED_RESPONSE=$(curl -s -X GET http://localhost:3001/auth/me \
        -H "Authorization: Bearer $TOKEN")
    
    if [[ $PROTECTED_RESPONSE == *"email"* ]]; then
        echo "✅ Protected endpoint access successful!"
    else
        echo "❌ Protected endpoint access failed! Response: $PROTECTED_RESPONSE"
        exit 1
    fi
fi

echo -e "\n✨ All tests passed successfully! ✨" 