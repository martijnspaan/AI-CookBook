# HTTPS Setup for AI Cookbook Test Environment

This document explains how to configure HTTPS for the AI Cookbook test environment running on Azure Kubernetes Service.

## Overview

The test environment is configured to serve the application over HTTPS at:
- **Web Application**: https://ai-cookbook-test.westeurope.cloudapp.azure.com
- **API**: https://ai-cookbook-test.westeurope.cloudapp.azure.com/api
- **API Documentation**: https://ai-cookbook-test.westeurope.cloudapp.azure.com/swagger

## Files Modified

### 1. Ingress Configuration (`k8s/test/ingress-test.yaml`)
- Enabled SSL redirect: `ssl-redirect: "true"`
- Enabled force SSL redirect: `force-ssl-redirect: "true"`
- Added TLS configuration with proper host
- Updated host rules to use the test domain

### 2. Deployment Script (`k8s/test/deploy-test.ps1`)
- Added OpenSSL requirement check
- Added automatic TLS certificate generation
- Updated TLS secret application logic

### 3. New Scripts Created

#### `azure/generate-test-certificate.ps1`
Generates a self-signed TLS certificate for the test domain.

**Usage:**
```powershell
.\azure\generate-test-certificate.ps1 -Domain "ai-cookbook-test.westeurope.cloudapp.azure.com"
```

#### `azure/fix-https-test.ps1`
Fixes HTTPS configuration for an existing deployment.

**Usage:**
```powershell
.\azure\fix-https-test.ps1
```

#### `azure/test-https.ps1`
Tests the HTTPS configuration and endpoints.

**Usage:**
```powershell
.\azure\test-https.ps1
```

## Setup Process

### For New Deployments

1. Run the updated deployment script:
   ```powershell
   cd k8s\test
   .\deploy-test.ps1
   ```

   The script will automatically:
   - Generate a TLS certificate
   - Apply the updated ingress configuration
   - Configure HTTPS properly

### For Existing Deployments

1. Run the HTTPS fix script:
   ```powershell
   .\azure\fix-https-test.ps1
   ```

   This script will:
   - Generate a new TLS certificate
   - Update the ingress configuration
   - Apply the TLS certificate to Kubernetes

### Testing the Setup

1. Test the HTTPS configuration:
   ```powershell
   .\azure\test-https.ps1
   ```

2. Access the application in your browser:
   - https://ai-cookbook-test.westeurope.cloudapp.azure.com

## Important Notes

### Self-Signed Certificate
The setup uses a self-signed certificate, which means:
- Browsers will show a security warning
- Users need to click "Advanced" and "Proceed to site"
- This is normal for test environments

### Production Considerations
For production environments, consider:
- Using Let's Encrypt certificates
- Setting up cert-manager for automatic certificate management
- Using a proper certificate authority

### Troubleshooting

#### Certificate Issues
If you encounter certificate problems:
1. Check if the TLS secret exists:
   ```bash
   kubectl get secret ai-cookbook-tls-test -n ai-cookbook-test
   ```

2. Verify the certificate details:
   ```bash
   kubectl get secret ai-cookbook-tls-test -n ai-cookbook-test -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout
   ```

#### Ingress Issues
If the ingress is not working:
1. Check ingress status:
   ```bash
   kubectl get ingress -n ai-cookbook-test
   kubectl describe ingress ai-cookbook-ingress-test -n ai-cookbook-test
   ```

2. Check ingress controller logs:
   ```bash
   kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
   ```

## Security Features

The HTTPS configuration includes:
- TLS 1.2 and 1.3 support
- Strong cipher suites
- Security headers (HSTS, X-Frame-Options, etc.)
- Content Security Policy
- Rate limiting
- CORS configuration

## Support

If you encounter issues:
1. Check the Azure resource group: `AI-CookBook`
2. Verify the AKS cluster: `k8s-ai-cookbook`
3. Ensure you're in the correct Azure subscription: `Playground - masp`
