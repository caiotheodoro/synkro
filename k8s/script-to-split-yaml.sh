#!/bin/bash

# This script extracts resources from a monolithic YAML file
# and organizes them into a proper Kubernetes directory structure

# Input file
INPUT_FILE="k8s-all-services.yaml"

# Create base directory structure if it doesn't exist
mkdir -p k8s/{ai-ml-predictions,api-gateway-auth,notification-service,frontend/{dashboard,auth,landing},elk-stack/{elasticsearch,logstash,kibana},database/postgres}

# Function to extract resources by kind and name pattern
extract_resource() {
  local KIND=$1
  local NAME_PATTERN=$2
  local OUTPUT_DIR=$3
  local OUTPUT_FILE=$4

  echo "Extracting $KIND $NAME_PATTERN to $OUTPUT_DIR/$OUTPUT_FILE..."
  
  # Use csplit to split the file at each "---" marker
  csplit -s -f "temp-" $INPUT_FILE "/^---$/" "{*}"
  
  # Find the matching resource and write it to the output file
  for file in temp-*; do
    if grep -q "kind: $KIND" $file && grep -q "name: $NAME_PATTERN" $file; then
      cat $file > "$OUTPUT_DIR/$OUTPUT_FILE"
      echo "Extracted to $OUTPUT_DIR/$OUTPUT_FILE"
      break
    fi
  done
  
  # Clean up temporary files
  rm -f temp-*
}

# Extract deployments, services, statefulsets for each component
extract_resource "Deployment" "ai-ml-predictions" "k8s/ai-ml-predictions" "deployment.yaml"
extract_resource "Service" "ai-ml-predictions" "k8s/ai-ml-predictions" "service.yaml"

extract_resource "Deployment" "api-gateway-auth" "k8s/api-gateway-auth" "deployment.yaml"
extract_resource "Service" "api-gateway-auth" "k8s/api-gateway-auth" "service.yaml"

extract_resource "Deployment" "notification-service" "k8s/notification-service" "deployment.yaml"
extract_resource "Service" "notification-service" "k8s/notification-service" "service.yaml"

extract_resource "Deployment" "frontend-dashboard" "k8s/frontend/dashboard" "deployment.yaml"
extract_resource "Service" "frontend-dashboard" "k8s/frontend/dashboard" "service.yaml"

extract_resource "Deployment" "frontend-auth" "k8s/frontend/auth" "deployment.yaml"
extract_resource "Service" "frontend-auth" "k8s/frontend/auth" "service.yaml"

extract_resource "Deployment" "frontend-landing" "k8s/frontend/landing" "deployment.yaml"
extract_resource "Service" "frontend-landing" "k8s/frontend/landing" "service.yaml"

extract_resource "StatefulSet" "elasticsearch" "k8s/elk-stack/elasticsearch" "statefulset.yaml"
extract_resource "Service" "elasticsearch" "k8s/elk-stack/elasticsearch" "service.yaml"

extract_resource "Deployment" "logstash" "k8s/elk-stack/logstash" "deployment.yaml"
extract_resource "Service" "logstash" "k8s/elk-stack/logstash" "service.yaml"

extract_resource "Deployment" "kibana" "k8s/elk-stack/kibana" "deployment.yaml"
extract_resource "Service" "kibana" "k8s/elk-stack/kibana" "service.yaml"

extract_resource "StatefulSet" "postgres" "k8s/database/postgres" "statefulset.yaml"
extract_resource "Service" "postgres" "k8s/database/postgres" "service.yaml"

# Create kustomization files
echo "Creating kustomization.yaml files..."

# Create component kustomization files
for dir in k8s/ai-ml-predictions k8s/api-gateway-auth k8s/notification-service k8s/frontend/{dashboard,auth,landing} k8s/elk-stack/{elasticsearch,logstash,kibana} k8s/database/postgres; do
  component=$(basename $dir)
  cat > "$dir/kustomization.yaml" <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
$([ -f "$dir/deployment.yaml" ] && echo "- deployment.yaml")
$([ -f "$dir/statefulset.yaml" ] && echo "- statefulset.yaml")
$([ -f "$dir/service.yaml" ] && echo "- service.yaml")

commonLabels:
  app: $component
EOF
  echo "Created $dir/kustomization.yaml"
done

# Create root kustomization
cat > "k8s/kustomization.yaml" <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ai-ml-predictions
- api-gateway-auth
- notification-service
- frontend/dashboard
- frontend/auth
- frontend/landing
- elk-stack/elasticsearch
- elk-stack/logstash
- elk-stack/kibana
- database/postgres

namespace: default

commonLabels:
  part-of: synkro-platform
EOF

echo "Created k8s/kustomization.yaml"
echo "Done! Your Kubernetes configuration is now properly structured." 