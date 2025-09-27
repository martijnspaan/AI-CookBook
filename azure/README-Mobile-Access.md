# Mobile Access Setup for AI Cookbook

This document explains how to set up your AI Cookbook application for public access from any device, including mobile devices.

## Overview

The setup configures your AI Cookbook application to be accessible via a public domain with a valid SSL certificate, allowing access from any device with internet connectivity.

### What's Configured

1. **DNS Zone and Records**: Creates a public DNS zone and A records
2. **SSL Certificate**: Sets up Let's Encrypt certificate for HTTPS
3. **Ingress Controller**: Configures public ingress with proper SSL termination
4. **Security**: Implements security headers and CORS for public access

## Prerequisites

- Azure CLI installed and logged in
- kubectl installed and configured
- Docker installed (for building images)
- Access to the `Playground - masp` Azure subscription
- Access to the `AI-CookBook` resource group

## Quick Start

### 1. Run the Setup Script

```powershell
# Change to the azure directory
cd azure

# Run the mobile access setup (replace with your email)
.\setup-mobile-access.ps1 -Email "your-email@example.com"
```

This script will:
- Deploy/update your application
- Install cert-manager
- Configure DNS records
- Set up SSL certificate with Let's Encrypt
- Configure public ingress

### 2. Wait for Setup Completion

The script will take several minutes to complete. It will:
- Wait for the load balancer to get an external IP
- Wait for DNS propagation
- Wait for SSL certificate issuance by Let's Encrypt

### 3. Test the Setup

```powershell
# Test the configuration
.\test-mobile-access.ps1
```

### 4. Access from Any Device

Your application will be accessible at:
- **Web Application**: https://ai-cookbook-test.westeurope.cloudapp.azure.com
- **API**: https://ai-cookbook-test.westeurope.cloudapp.azure.com/api
- **API Documentation**: https://ai-cookbook-test.westeurope.cloudapp.azure.com/swagger

## Files Created/Modified

### New Files
- `azure/setup-mobile-access.ps1` - Main setup script
- `azure/test-mobile-access.ps1` - Test script
- `k8s/test/ingress-public.yaml` - Public ingress configuration
- `k8s/test/certificate-public.yaml` - SSL certificate resource

### Existing Files Modified
- DNS zone created in Azure
- Kubernetes ingress updated for public access

## Detailed Setup Process

### Step 1: Application Deployment
The script ensures your application is deployed with the latest images.

### Step 2: cert-manager Installation
Installs cert-manager for automatic SSL certificate management.

### Step 3: Let's Encrypt Configuration
Creates a ClusterIssuer for Let's Encrypt certificate authority.

### Step 4: DNS Configuration
- Creates a public DNS zone: `westeurope.cloudapp.azure.com`
- Creates an A record: `ai-cookbook-test` → External IP

### Step 5: SSL Certificate
- Creates a Certificate resource for automatic certificate management
- Uses HTTP-01 challenge for domain validation
- Certificate is valid for 90 days with automatic renewal

### Step 6: Public Ingress
- Configures ingress for public access
- Enables HTTPS redirect
- Adds security headers
- Configures CORS for cross-origin requests

## Security Features

### SSL/TLS Configuration
- TLS 1.2 and 1.3 support
- Strong cipher suites
- Automatic HTTPS redirect
- HSTS headers

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy
- Strict-Transport-Security

### CORS Configuration
- Configured for public access
- Allows necessary HTTP methods
- Includes proper headers

## Testing

### Automated Testing
Run the test script to verify:
- DNS resolution
- Ingress configuration
- SSL certificate status
- Application pods status
- HTTP/HTTPS connectivity
- API endpoint accessibility

### Manual Testing
1. **Desktop Browser**: Open https://ai-cookbook-test.westeurope.cloudapp.azure.com
2. **Mobile Browser**: Open the same URL on your Android device
3. **API Testing**: Visit https://ai-cookbook-test.westeurope.cloudapp.azure.com/swagger
4. **Share URL**: Test from other devices/networks

## Troubleshooting

### Common Issues

#### DNS Resolution Fails
```powershell
# Check DNS propagation
nslookup ai-cookbook-test.westeurope.cloudapp.azure.com

# Check if DNS zone exists
az network dns zone list --resource-group AI-CookBook
```

#### SSL Certificate Issues
```powershell
# Check certificate status
kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test

# Check certificate details
kubectl describe certificate ai-cookbook-tls-public -n ai-cookbook-test

# Check cert-manager logs
kubectl logs -n cert-manager -l app.kubernetes.io/name=cert-manager
```

#### Ingress Issues
```powershell
# Check ingress status
kubectl get ingress -n ai-cookbook-test

# Check ingress details
kubectl describe ingress ai-cookbook-ingress-public -n ai-cookbook-test

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

#### Application Issues
```powershell
# Check pod status
kubectl get pods -n ai-cookbook-test

# Check application logs
kubectl logs -f deployment/api-deployment-test -n ai-cookbook-test
kubectl logs -f deployment/web-deployment-test -n ai-cookbook-test
```

### External IP Not Available
If the external IP is not available:
1. Wait a few minutes for the load balancer to provision
2. Check if the ingress controller is running:
   ```powershell
   kubectl get pods -n ingress-nginx
   ```
3. Verify the ingress service:
   ```powershell
   kubectl get svc -n ingress-nginx
   ```

### Certificate Not Issued
If the SSL certificate is not issued:
1. Check if the domain is accessible via HTTP
2. Verify DNS resolution is working
3. Check cert-manager logs for errors
4. Ensure the domain is not behind a firewall

## Maintenance

### Certificate Renewal
Certificates are automatically renewed by cert-manager before expiration (15 days before expiry).

### Monitoring
Monitor your application with:
```powershell
# Check application status
kubectl get pods -n ai-cookbook-test

# Check ingress status
kubectl get ingress -n ai-cookbook-test

# Check certificate status
kubectl get certificate -n ai-cookbook-test
```

### Updates
To update the application:
1. Build new images
2. Update the deployment
3. The ingress and certificate configuration will remain unchanged

## Cost Considerations

### Azure Resources
- DNS Zone: ~$0.50/month per zone
- Load Balancer: ~$18/month for standard load balancer
- AKS Cluster: Existing costs (no additional cost for ingress)

### Let's Encrypt
- Free SSL certificates
- No additional cost for certificate management

## Security Considerations

### Public Access
- Your application is now publicly accessible
- Ensure your application has proper authentication if needed
- Monitor access logs regularly

### Domain Security
- The domain is publicly resolvable
- Consider implementing additional security measures
- Monitor for suspicious activity

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Check Azure resource group: `AI-CookBook`
4. Verify AKS cluster: `k8s-ai-cookbook`
5. Ensure you're in the correct Azure subscription: `Playground - masp`

## Next Steps

After successful setup:
1. Test from multiple devices and networks
2. Share the URL with others for testing
3. Consider implementing monitoring and alerting
4. Plan for production deployment with a custom domain
5. Implement additional security measures as needed

Your AI Cookbook is now accessible from any device with internet connectivity! 🎉
