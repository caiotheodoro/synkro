# Kubernetes Configuration for Synkro Platform

This directory contains the Kubernetes manifests for the Synkro platform, organized using Kustomize.

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

## Usage

### Apply all resources in the default configuration

```bash
kubectl apply -k k8s/
```

### Apply a specific component

```bash
# Apply only the database
kubectl apply -k k8s/database/

# Apply only the AI/ML predictions service
kubectl apply -k k8s/ai-ml-predictions/
```

### Apply environment-specific configurations

```bash
# Apply development environment
kubectl apply -k k8s/overlays/development/

# Apply staging environment
kubectl apply -k k8s/overlays/staging/

# Apply production environment
kubectl apply -k k8s/overlays/production/
```

## Benefits of This Structure

1. **Modularity**: Each service has its own directory with its own configuration
2. **Maintainability**: Changes to one service don't affect others
3. **Selective Deployment**: Deploy only what you need
4. **Environment Overrides**: Different configurations for development, staging, and production
5. **Reduced Duplication**: Common configurations are defined once and reused

## Environment Configuration Details

### Development

- Uses reduced resource requirements
- Single replica for each service
- Development-specific database names
- Debug mode enabled

### Staging

- Uses staging container images
- Default resource configurations
- Separate namespace

### Production

- Production container images with specific version tags
- Horizontal Pod Autoscalers (HPA) for key services
- Pod Disruption Budgets (PDB) for availability
- Separate namespace

## Ingress Configuration

External access is configured through the Ingress resource with the following endpoints:

- `synkro.local` - Main application
  - `/api/auth` - Authentication API
  - `/dashboard` - Dashboard UI
  - `/auth` - Authentication UI
  - `/` - Landing page
- `kibana.synkro.local` - Kibana dashboard

## Adding New Services

To add a new service:

1. Create a new directory for your service
2. Add deployment.yaml, service.yaml, and kustomization.yaml
3. Add the service to the root kustomization.yaml
4. Add environment-specific configurations in the overlays if needed 