# Kubernetes Orchestration Guidelines

## 🐳 Environment Setup & Prerequisites

### Local Development Environment
- **Docker Desktop**: Assume Docker Desktop for Windows is installed and running
- **Kubernetes Cluster**: Enable Kubernetes in Docker Desktop settings
- **kubectl**: Ensure kubectl is properly configured for cluster access
- **Helm**: Install Helm for package management and templating

### Cloud Environment
- **Azure Kubernetes Service (AKS)**: Assume AKS cluster is provisioned and accessible
- **Cluster Access**: Ensure proper RBAC and network policies are configured
- **Container Registry**: Configure Azure Container Registry (ACR) for image storage

## 🌐 Service Configuration & Networking

### Port Allocation & Service Discovery
- **Web Application**: Exposed on port `4200` for local development
- **API Service**: Exposed on port `4201` for local development
- **Internal Communication**: Use Kubernetes service names for inter-pod communication
- **Load Balancing**: Configure appropriate load balancer services for external access

### Network Policies
- **Security Groups**: Implement network policies for micro-segmentation
- **Ingress Controllers**: Configure NGINX or Traefik ingress controllers
- **TLS Termination**: Implement proper SSL/TLS termination at ingress level
- **DNS Resolution**: Ensure proper DNS configuration for service discovery

## 📋 Kubernetes Best Practices

### Resource Management
- **Resource Limits**: Define CPU and memory limits for all containers
- **Resource Requests**: Set appropriate resource requests for scheduling
- **Quality of Service**: Implement proper QoS classes (Guaranteed, Burstable, BestEffort)
- **Horizontal Pod Autoscaler**: Configure HPA for automatic scaling based on metrics

### Pod & Deployment Strategy
- **Multi-Replica**: Run multiple replicas for high availability
- **Rolling Updates**: Use rolling update strategy for zero-downtime deployments
- **Health Checks**: Implement liveness and readiness probes
- **Pod Disruption Budgets**: Configure PDBs to maintain service availability

### Configuration Management
- **ConfigMaps**: Use ConfigMaps for non-sensitive configuration data
- **Secrets**: Store sensitive data in Kubernetes secrets with proper encryption
- **Environment Variables**: Inject configuration through environment variables
- **Volume Mounts**: Use appropriate volume types for persistent and ephemeral storage

## 🔧 YAML Template Standards

### Template Structure & Organization
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: application-name
  namespace: ai-cookbook
  labels:
    app: application-name
    version: "1.0.0"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: application-name
  template:
    metadata:
      labels:
        app: application-name
    spec:
      containers:
      - name: application-name
        image: registry/application:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Naming Conventions
- **Resource Names**: Use kebab-case for all resource names
- **Labels**: Implement consistent labeling strategy across all resources
- **Annotations**: Use annotations for metadata and configuration hints
- **Namespaces**: Organize resources in appropriate namespaces

### Security Configuration
- **Security Contexts**: Configure security contexts for pods and containers
- **Pod Security Standards**: Implement pod security standards and policies
- **RBAC**: Configure proper role-based access control
- **Network Policies**: Implement network segmentation policies

## 🚀 Deployment & Operations

### Deployment Strategies
- **Blue-Green**: Implement blue-green deployment for zero-downtime updates
- **Canary**: Use canary deployments for gradual rollouts
- **Rolling Updates**: Configure rolling updates with proper health checks
- **Rollback Procedures**: Implement automated rollback capabilities

### Monitoring & Observability
- **Prometheus**: Integrate Prometheus for metrics collection
- **Grafana**: Use Grafana for visualization and alerting
- **Jaeger**: Implement distributed tracing for request tracking
- **Log Aggregation**: Configure centralized logging with Fluentd or similar

### Backup & Disaster Recovery
- **Velero**: Use Velero for cluster backup and disaster recovery
- **Persistent Volumes**: Implement proper backup strategies for persistent data
- **Cross-Region**: Consider multi-region deployment for disaster recovery
- **Recovery Procedures**: Document and test recovery procedures regularly

## 🔍 Troubleshooting & Debugging

### Common Debugging Commands
```bash
# Check pod status
kubectl get pods -n ai-cookbook

# View pod logs
kubectl logs -f <pod-name> -n ai-cookbook

# Describe resource details
kubectl describe pod <pod-name> -n ai-cookbook

# Execute commands in running pod
kubectl exec -it <pod-name> -n ai-cookbook -- /bin/bash
```

### Health Check Configuration
- **Liveness Probes**: Configure to detect and restart unhealthy containers
- **Readiness Probes**: Ensure traffic only routes to ready containers
- **Startup Probes**: Handle slow-starting containers appropriately
- **Probe Timing**: Set appropriate initial delay, timeout, and period values