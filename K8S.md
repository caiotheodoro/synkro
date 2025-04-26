# Kubernetes Configuration Guide for Synkro Platform

This guide explains how to work with the Kubernetes configuration for the Synkro platform.

## Overview

The Synkro platform uses a modular Kubernetes configuration based on Kustomize. This approach provides:

- **Modularity**: Each service has its own configuration
- **Environment-specific settings**: Different configs for development, staging, and production
- **Selective deployment**: Deploy only what you need
- **Simplified management**: Common settings defined once and reused

## Directory Structure

```
k8s/
├── ai-ml-predictions/      # AI/ML prediction service
├── api-gateway-auth/       # API Gateway and Auth service
├── notification-service/   # Notification service
├── frontend/               # Frontend services
│   ├── dashboard/          # Dashboard UI
│   ├── auth/               # Authentication UI
│   └── landing/            # Landing page
├── elk-stack/              # Logging infrastructure
│   ├── elasticsearch/      # Elasticsearch database
│   ├── logstash/           # Log processing
│   └── kibana/             # Log visualization
├── database/               # Database services
│   └── postgres/           # PostgreSQL database
├── overlays/               # Environment-specific configurations
│   ├── development/        # Development environment
│   ├── staging/            # Staging environment
│   └── production/         # Production environment
├── ingress.yaml            # Ingress configuration
└── kustomization.yaml      # Root kustomization file
```

## Quick Start

### Prerequisites

- Kubernetes cluster (local or remote)
- kubectl CLI tool
- kustomize CLI tool (optional, as it's built into kubectl)

### Deploying to Different Environments

#### Development Environment

```bash
# Deploy the entire stack to development
kubectl apply -k k8s/overlays/development/

# Verify the deployment
kubectl get all -n development
```

Development environment uses:
- Single replicas for all services
- Reduced resource requirements
- Development database names
- Debug mode enabled

#### Staging Environment

```bash
# Deploy the entire stack to staging
kubectl apply -k k8s/overlays/staging/

# Verify the deployment
kubectl get all -n staging
```

Staging environment uses:
- Staging container images from GitHub Container Registry
- Default resource configurations
- Separate namespace

#### Production Environment

```bash
# Deploy the entire stack to production
kubectl apply -k k8s/overlays/production/

# Verify the deployment
kubectl get all -n production
```

Production environment uses:
- Production container images with versioned tags
- Horizontal Pod Autoscalers (HPA) for key services
- Pod Disruption Budgets (PDB) for high availability
- Separate namespace

### Deploying Individual Components

You can deploy individual components or services as needed:

```bash
# Deploy only the database
kubectl apply -k k8s/database/

# Deploy only the AI/ML predictions service
kubectl apply -k k8s/ai-ml-predictions/

# Deploy only the frontend services
kubectl apply -k k8s/frontend/
```

## Advanced Usage

### Accessing Services

The platform is configured with an Ingress controller for external access:

- Main application: `http://synkro.local`
  - Authentication API: `http://synkro.local/api/auth`
  - Dashboard UI: `http://synkro.local/dashboard`
  - Authentication UI: `http://synkro.local/auth`
  - Landing page: `http://synkro.local/`

- Kibana dashboard: `http://kibana.synkro.local`

For local development, add these entries to your `/etc/hosts` file:
```
127.0.0.1 synkro.local kibana.synkro.local
```

### Monitoring Deployments

```bash
# Get all resources in the development namespace
kubectl get all -n development

# Watch pods in real-time
kubectl get pods -n development -w

# Get logs for a specific service
kubectl logs -n development -l app=ai-ml-predictions -f

# Describe a specific deployment
kubectl describe deployment -n development ai-ml-predictions
```

### Making Configuration Changes

#### Modifying Resource Requirements

To change resource requirements for a service in development:

1. Edit the appropriate patch file:
   ```bash
   vim k8s/overlays/development/patches/ai-ml-predictions-deployment-patch.yaml
   ```

2. Reapply the configuration:
   ```bash
   kubectl apply -k k8s/overlays/development/
   ```

#### Changing Container Images

To update the container image for a service in staging:

1. Edit the kustomization.yaml:
   ```bash
   vim k8s/overlays/staging/kustomization.yaml
   ```

2. Update the image tag:
   ```yaml
   images:
   - name: ai-ml-predictions
     newName: ghcr.io/synkro/ai-ml-predictions
     newTag: v1.0.1  # Update this line
   ```

3. Reapply the configuration:
   ```bash
   kubectl apply -k k8s/overlays/staging/
   ```

### Adding a New Service

To add a new service to the platform:

1. Create a new directory for your service:
   ```bash
   mkdir -p k8s/new-service
   ```

2. Create the necessary YAML files:
   - `deployment.yaml` - Defines the deployment
   - `service.yaml` - Defines the service
   - `kustomization.yaml` - Kustomize configuration

3. Add the service to the root kustomization:
   ```bash
   vim k8s/kustomization.yaml
   ```
   ```yaml
   resources:
   - ai-ml-predictions
   - api-gateway-auth
   - notification-service
   - frontend
   - elk-stack
   - database
   - new-service  # Add this line
   - ingress.yaml
   ```

4. Add environment-specific configurations in the overlays if needed

## Troubleshooting

### Common Issues

#### Pods are not starting

Check for errors with:
```bash
kubectl describe pod -n <namespace> <pod-name>
kubectl logs -n <namespace> <pod-name>
```

#### Service is not accessible

1. Check if the service exists:
   ```bash
   kubectl get svc -n <namespace>
   ```

2. Check if the pods are running:
   ```bash
   kubectl get pods -n <namespace> -l app=<app-name>
   ```

3. Check if the ingress is configured correctly:
   ```bash
   kubectl get ingress -n <namespace>
   kubectl describe ingress -n <namespace>
   ```

#### Resource constraints

If pods are being evicted or not scheduling due to resource constraints:

1. Check node resources:
   ```bash
   kubectl describe nodes
   ```

2. Adjust resource requests/limits in the appropriate overlay

## Environment-Specific Configuration Details

### Development Environment

Located in `k8s/overlays/development/`:

- `kustomization.yaml` - Main configuration
- `replicas-patch.yaml` - Sets replicas to 1 for all deployments
- `patches/` - JSON patches for specific services

### Staging Environment

Located in `k8s/overlays/staging/`:

- `kustomization.yaml` - Updates image references to staging versions

### Production Environment

Located in `k8s/overlays/production/`:

- `kustomization.yaml` - Main configuration with production images
- `pdb.yaml` - Pod Disruption Budgets for high availability
- `hpa-patch.yaml` - Horizontal Pod Autoscaler configuration 