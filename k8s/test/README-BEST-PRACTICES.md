# AI Cookbook Kubernetes Test Environment - Best Practices Applied

This document outlines the Kubernetes best practices that have been applied to the test environment configuration.

## Security Best Practices

### 1. Pod Security Standards
- **Namespace-level security**: Applied `restricted` pod security standards
- **Non-root containers**: All containers run as non-root user (UID 1000)
- **Read-only root filesystem**: Enabled for all containers
- **Capability dropping**: All capabilities dropped (`ALL`)
- **Seccomp profiles**: Runtime default seccomp profile applied
- **Security contexts**: Comprehensive security context configuration

### 2. Network Security
- **Network policies**: Granular network policies with least privilege principle
- **Separate policies**: Individual policies for API, web, and monitoring components
- **Ingress restrictions**: Only allow traffic from ingress controller and internal services
- **Egress controls**: Limited egress to necessary external services (HTTPS, DNS)

### 3. RBAC (Role-Based Access Control)
- **Least privilege**: Minimal required permissions for service accounts
- **Namespace isolation**: Roles scoped to specific namespace
- **Resource-specific permissions**: Granular permissions for different resource types

## Resource Management Best Practices

### 1. Resource Quotas and Limits
- **Namespace quotas**: Defined resource quotas to prevent resource exhaustion
- **Container limits**: CPU and memory limits for all containers
- **Request specifications**: Proper resource requests for scheduling
- **Limit ranges**: Default limits and requests for containers

### 2. Horizontal Pod Autoscaling (HPA)
- **CPU-based scaling**: Scale based on CPU utilization (70% threshold)
- **Memory-based scaling**: Scale based on memory utilization (80% threshold)
- **Scaling behavior**: Configured scale-up and scale-down policies
- **Replica limits**: Minimum and maximum replica counts defined

### 3. Pod Disruption Budgets (PDB)
- **Availability guarantees**: Minimum available pods during disruptions
- **Rolling updates**: Safe rolling updates with PDB protection

## Deployment Best Practices

### 1. Rolling Updates
- **Percentage-based updates**: 25% max unavailable and max surge
- **Revision history**: Limited to 10 revisions for cleanup
- **Graceful shutdown**: 30-second termination grace period

### 2. Health Checks
- **Startup probes**: Detect when containers are ready to accept traffic
- **Liveness probes**: Detect when containers need to be restarted
- **Readiness probes**: Detect when containers are ready to serve traffic
- **Proper endpoints**: Dedicated health check endpoints for each probe type

### 3. Resource Optimization
- **Appropriate resource requests**: Based on actual usage patterns
- **Resource limits**: Prevent resource starvation
- **Node selection**: Linux-specific node selection
- **Pod anti-affinity**: Spread pods across different nodes

## Monitoring and Observability

### 1. Prometheus Integration
- **Service monitors**: Automatic discovery of metrics endpoints
- **Prometheus rules**: Alerting rules for critical metrics
- **Metrics collection**: CPU, memory, and custom application metrics

### 2. Logging
- **Fluent Bit configuration**: Centralized logging setup
- **Structured logging**: JSON format for better parsing
- **Log aggregation**: Container log collection and forwarding

### 3. Alerting
- **High CPU usage**: Alert when CPU usage exceeds 80%
- **High memory usage**: Alert when memory usage exceeds 80%
- **Pod crashes**: Alert on pod restart loops
- **Pod readiness**: Alert when pods are not ready

## Operational Excellence

### 1. Backup and Recovery
- **Automated backups**: Daily backup cron job
- **Resource backup**: Backup of all Kubernetes resources
- **Data backup**: CosmosDB data backup (when accessible)
- **Backup retention**: Limited backup history for storage management

### 2. Configuration Management
- **ConfigMaps**: Non-sensitive configuration data
- **Secrets**: Sensitive data with proper labeling
- **External secrets**: Integration with external secret management
- **Environment-specific**: Separate configurations for different environments

### 3. Network Configuration
- **Ingress controller**: Nginx ingress with proper annotations
- **TLS termination**: SSL/TLS configuration at ingress level
- **Security headers**: Security headers for web applications
- **Rate limiting**: Request rate limiting and connection limits

## File Structure

```
k8s/test/
├── README-BEST-PRACTICES.md          # This documentation
├── deploy-complete-test.yaml         # Complete deployment with all best practices
├── api-deployment-test.yaml          # API deployment with security enhancements
├── web-deployment-test.yaml          # Web deployment with security enhancements
├── api-service-test.yaml             # API service configuration
├── web-service-test.yaml             # Web service configuration
├── namespace-test.yaml               # Namespace with pod security standards
├── configmap-test.yaml               # Application configuration
├── secret-test.yaml                  # Application secrets
├── rbac-test.yaml                    # RBAC configuration
├── network-policy-test.yaml          # Network security policies
├── pod-disruption-budget-test.yaml   # Pod disruption budgets
├── hpa-test.yaml                     # Horizontal pod autoscaler
├── ingress-test.yaml                 # Ingress configuration
├── tls-secret-test.yaml              # TLS certificates
├── pod-security-test.yaml            # Pod security policies
├── resource-quotas-test.yaml         # Resource quotas and limits
├── monitoring-test.yaml              # Monitoring and alerting
├── backup-test.yaml                  # Backup and recovery
└── deploy-all-test.yaml              # Original deployment file
```

## Deployment Instructions

### Prerequisites
1. Kubernetes cluster with RBAC enabled
2. Ingress controller (nginx) installed
3. Prometheus operator (optional, for monitoring)
4. External secret operator (optional, for secret management)
5. Pod Security Standards enabled

### Deployment Order
1. **Security and Resource Management**:
   ```bash
   kubectl apply -f pod-security-test.yaml
   kubectl apply -f resource-quotas-test.yaml
   ```

2. **RBAC and Configuration**:
   ```bash
   kubectl apply -f rbac-test.yaml
   kubectl apply -f configmap-test.yaml
   kubectl apply -f secret-test.yaml
   ```

3. **Application Deployments**:
   ```bash
   kubectl apply -f api-deployment-test.yaml
   kubectl apply -f web-deployment-test.yaml
   kubectl apply -f api-service-test.yaml
   kubectl apply -f web-service-test.yaml
   ```

4. **High Availability and Scaling**:
   ```bash
   kubectl apply -f pod-disruption-budget-test.yaml
   kubectl apply -f hpa-test.yaml
   ```

5. **Network and Ingress**:
   ```bash
   kubectl apply -f network-policy-test.yaml
   kubectl apply -f ingress-test.yaml
   ```

6. **Monitoring and Operations**:
   ```bash
   kubectl apply -f monitoring-test.yaml
   kubectl apply -f backup-test.yaml
   ```

### Alternative: Single Command Deployment
```bash
kubectl apply -f deploy-complete-test.yaml
```

## Validation

After deployment, validate the configuration:

```bash
# Check pod security
kubectl get pods -n ai-cookbook-test -o wide

# Check resource quotas
kubectl describe resourcequota -n ai-cookbook-test

# Check network policies
kubectl get networkpolicies -n ai-cookbook-test

# Check HPA
kubectl get hpa -n ai-cookbook-test

# Check services
kubectl get services -n ai-cookbook-test

# Check ingress
kubectl get ingress -n ai-cookbook-test
```

## Security Considerations

1. **Secrets Management**: Replace hardcoded secrets with external secret management
2. **TLS Certificates**: Use proper TLS certificates for production
3. **Image Security**: Use vulnerability scanning for container images
4. **Network Policies**: Regularly review and update network policies
5. **RBAC**: Regularly audit and review RBAC permissions

## Monitoring and Alerting

1. **Prometheus**: Set up Prometheus for metrics collection
2. **Grafana**: Configure dashboards for visualization
3. **AlertManager**: Set up alerting for critical issues
4. **Log Aggregation**: Use ELK stack or similar for log analysis

## Backup and Recovery

1. **Regular Backups**: Ensure daily backups are running
2. **Test Recovery**: Regularly test backup restoration
3. **Data Backup**: Implement CosmosDB backup strategy
4. **Disaster Recovery**: Document disaster recovery procedures

This configuration provides a production-ready Kubernetes deployment with comprehensive security, monitoring, and operational capabilities while maintaining the flexibility needed for a test environment.
