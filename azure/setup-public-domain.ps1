# PowerShell script to set up public domain access for AI Cookbook on Azure
# This script configures DNS, SSL certificate, and ingress for public access from any device

param(
    [string]$ResourceGroup = "AI-CookBook",
    [string]$AksClusterName = "k8s-ai-cookbook",
    [string]$Domain = "ai-cookbook-test.westeurope.cloudapp.azure.com",
    [string]$SubscriptionName = "Playground - masp",
    [switch]$SkipDNS = $false,
    [switch]$SkipSSL = $false,
    [switch]$SkipIngress = $false
)

Write-Host "Setting up public domain access for AI Cookbook..." -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "AKS Cluster: $AksClusterName" -ForegroundColor Yellow

# Check if required tools are available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed or not in PATH"
    exit 1
}

# Check if logged into Azure
Write-Host "Checking Azure authentication..." -ForegroundColor Yellow
$azAccount = az account show --query "name" -o tsv 2>$null
if (-not $azAccount) {
    Write-Error "Not logged into Azure. Please run 'az login' first."
    exit 1
}
Write-Host "Logged into Azure as: $azAccount" -ForegroundColor Green

# Set the correct subscription
if ($azAccount -ne $SubscriptionName) {
    Write-Host "Switching to subscription: $SubscriptionName" -ForegroundColor Yellow
    az account set --subscription "$SubscriptionName"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to switch to subscription: $SubscriptionName"
        exit 1
    }
}

# Get AKS credentials
Write-Host "Getting AKS credentials..." -ForegroundColor Yellow
az aks get-credentials --resource-group $ResourceGroup --name $AksClusterName --overwrite-existing

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to get AKS credentials. Please check your resource group and cluster name."
    exit 1
}

# Step 1: Configure DNS Zone and Records
if (-not $SkipDNS) {
    Write-Host "`n=== Step 1: Configuring DNS Zone and Records ===" -ForegroundColor Green
    
    $dnsZoneName = "westeurope.cloudapp.azure.com"
    $dnsZoneResourceGroup = "AI-CookBook"
    
    # Check if DNS zone exists
    Write-Host "Checking if DNS zone exists..." -ForegroundColor Yellow
    $existingZone = az network dns zone show --resource-group $dnsZoneResourceGroup --name $dnsZoneName --query "name" -o tsv 2>$null
    
    if (-not $existingZone) {
        Write-Host "Creating DNS zone: $dnsZoneName" -ForegroundColor Yellow
        az network dns zone create --resource-group $dnsZoneResourceGroup --name $dnsZoneName
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to create DNS zone"
            exit 1
        }
        Write-Host "DNS zone created successfully!" -ForegroundColor Green
    } else {
        Write-Host "DNS zone already exists: $existingZone" -ForegroundColor Green
    }
    
    # Get the external IP of the ingress controller
    Write-Host "Getting ingress controller external IP..." -ForegroundColor Yellow
    $externalIP = kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
    
    if (-not $externalIP -or $externalIP -eq "") {
        Write-Warning "No external IP found for ingress controller. This might be normal if the load balancer is still provisioning."
        Write-Host "You may need to wait a few minutes for the load balancer to get an external IP." -ForegroundColor Yellow
        Write-Host "Run this command to check: kubectl get svc -n ingress-nginx" -ForegroundColor Cyan
    } else {
        Write-Host "External IP found: $externalIP" -ForegroundColor Green
        
        # Create A record for the domain
        $hostName = $Domain.Split('.')[0]  # Get 'ai-cookbook-test' from full domain
        Write-Host "Creating A record for $hostName pointing to $externalIP..." -ForegroundColor Yellow
        
        # Check if record already exists
        $existingRecord = az network dns record-set a show --resource-group $dnsZoneResourceGroup --zone-name $dnsZoneName --name $hostName --query "name" -o tsv 2>$null
        
        if (-not $existingRecord) {
            az network dns record-set a create --resource-group $dnsZoneResourceGroup --zone-name $dnsZoneName --name $hostName --ttl 300
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to create A record set"
                exit 1
            }
        }
        
        az network dns record-set a add-record --resource-group $dnsZoneResourceGroup --zone-name $dnsZoneName --record-set-name $hostName --ipv4-address $externalIP
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to add A record"
            exit 1
        }
        
        Write-Host "A record created successfully!" -ForegroundColor Green
        Write-Host "Domain $Domain now points to $externalIP" -ForegroundColor Cyan
    }
}

# Step 2: Configure SSL Certificate with Let's Encrypt
if (-not $SkipSSL) {
    Write-Host "`n=== Step 2: Configuring SSL Certificate ===" -ForegroundColor Green
    
    # Install cert-manager if not already installed
    Write-Host "Installing cert-manager..." -ForegroundColor Yellow
    $certManagerInstalled = kubectl get namespace cert-manager --ignore-not-found=true
    
    if (-not $certManagerInstalled) {
        Write-Host "Installing cert-manager..." -ForegroundColor Yellow
        
        # Install cert-manager
        kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install cert-manager"
            exit 1
        }
        
        # Wait for cert-manager to be ready
        Write-Host "Waiting for cert-manager to be ready..." -ForegroundColor Yellow
        kubectl wait --for=condition=ready --timeout=300s pod -l app.kubernetes.io/instance=cert-manager -n cert-manager
        
        Write-Host "cert-manager installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "cert-manager already installed" -ForegroundColor Green
    }
    
    # Create ClusterIssuer for Let's Encrypt
    Write-Host "Creating Let's Encrypt ClusterIssuer..." -ForegroundColor Yellow
    
    $clusterIssuerYaml = @"
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
  labels:
    app.kubernetes.io/name: cert-manager
    app.kubernetes.io/part-of: ai-cookbook
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com  # Change this to your email
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
"@
    
    $clusterIssuerPath = "cert-manager-clusterissuer.yaml"
    Set-Content -Path $clusterIssuerPath -Value $clusterIssuerYaml
    
    kubectl apply -f $clusterIssuerPath
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create ClusterIssuer"
        exit 1
    }
    
    Write-Host "ClusterIssuer created successfully!" -ForegroundColor Green
    
    # Clean up temporary file
    Remove-Item $clusterIssuerPath -Force
}

# Step 3: Update Ingress Configuration
if (-not $SkipIngress) {
    Write-Host "`n=== Step 3: Updating Ingress Configuration ===" -ForegroundColor Green
    
    # Change to k8s/test directory
    $originalLocation = Get-Location
    Set-Location "../k8s/test"
    
    # Update the ingress configuration to use cert-manager
    Write-Host "Updating ingress configuration..." -ForegroundColor Yellow
    
    $ingressContent = Get-Content "ingress-test.yaml" -Raw
    
    # Add cert-manager annotations
    $updatedIngressContent = $ingressContent -replace `
        'secretName: ai-cookbook-tls-test', `
        'secretName: ai-cookbook-tls-test
    cert-manager.io/cluster-issuer: letsencrypt-prod'
    
    # Update annotations to remove self-signed certificate references
    $updatedIngressContent = $updatedIngressContent -replace `
        'kubernetes.io/ingress.class: "nginx"', `
        'kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"'
    
    Set-Content -Path "ingress-test.yaml" -Value $updatedIngressContent
    
    # Apply the updated ingress
    Write-Host "Applying updated ingress configuration..." -ForegroundColor Yellow
    kubectl apply -f ingress-test.yaml
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to apply updated ingress configuration"
        Set-Location $originalLocation
        exit 1
    }
    
    Write-Host "Ingress configuration updated successfully!" -ForegroundColor Green
    
    # Return to original directory
    Set-Location $originalLocation
}

# Step 4: Wait for certificate to be issued
Write-Host "`n=== Step 4: Waiting for Certificate Issuance ===" -ForegroundColor Green
Write-Host "Waiting for SSL certificate to be issued by Let's Encrypt..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0

do {
    $attempt++
    Write-Host "Checking certificate status (attempt $attempt/$maxAttempts)..." -ForegroundColor Yellow
    
    $certificateStatus = kubectl get certificate ai-cookbook-tls-test -n ai-cookbook-test -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>$null
    
    if ($certificateStatus -eq "True") {
        Write-Host "SSL certificate issued successfully!" -ForegroundColor Green
        break
    } elseif ($certificateStatus -eq "False") {
        $reason = kubectl get certificate ai-cookbook-tls-test -n ai-cookbook-test -o jsonpath='{.status.conditions[?(@.type=="Ready")].message}' 2>$null
        Write-Host "Certificate issuance failed: $reason" -ForegroundColor Red
        break
    }
    
    if ($attempt -ge $maxAttempts) {
        Write-Warning "Certificate issuance is taking longer than expected."
        Write-Host "You can check the status manually with: kubectl get certificate ai-cookbook-tls-test -n ai-cookbook-test" -ForegroundColor Cyan
        break
    }
    
    Start-Sleep -Seconds 10
} while ($true)

# Step 5: Display final status and access information
Write-Host "`n=== Final Status ===" -ForegroundColor Green

Write-Host "`n=== DNS Configuration ===" -ForegroundColor Yellow
$externalIP = kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
if ($externalIP) {
    Write-Host "External IP: $externalIP" -ForegroundColor White
    Write-Host "Domain: $Domain" -ForegroundColor White
} else {
    Write-Host "External IP: Still provisioning..." -ForegroundColor Yellow
}

Write-Host "`n=== SSL Certificate Status ===" -ForegroundColor Yellow
kubectl get certificate ai-cookbook-tls-test -n ai-cookbook-test -o wide 2>$null

Write-Host "`n=== Ingress Status ===" -ForegroundColor Yellow
kubectl get ingress -n ai-cookbook-test -o wide

Write-Host "`n=== Application Access ===" -ForegroundColor Green
Write-Host "Your AI Cookbook application should now be accessible from any device at:" -ForegroundColor Cyan
Write-Host "  🌐 Web Application: https://$Domain" -ForegroundColor White
Write-Host "  🔌 API: https://$Domain/api" -ForegroundColor White
Write-Host "  📚 API Documentation: https://$Domain/swagger" -ForegroundColor White

Write-Host "`n=== Testing Instructions ===" -ForegroundColor Green
Write-Host "1. Test from your laptop browser: https://$Domain" -ForegroundColor White
Write-Host "2. Test from your Android device using the same URL" -ForegroundColor White
Write-Host "3. The SSL certificate should be trusted by all browsers" -ForegroundColor White
Write-Host "4. No security warnings should appear" -ForegroundColor White

Write-Host "`n=== Troubleshooting ===" -ForegroundColor Yellow
Write-Host "If the domain is not accessible:" -ForegroundColor White
Write-Host "1. Check DNS propagation: nslookup $Domain" -ForegroundColor White
Write-Host "2. Check ingress status: kubectl get ingress -n ai-cookbook-test" -ForegroundColor White
Write-Host "3. Check certificate status: kubectl get certificate ai-cookbook-tls-test -n ai-cookbook-test" -ForegroundColor White
Write-Host "4. Check ingress logs: kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx" -ForegroundColor White

Write-Host "`nPublic domain setup completed successfully!" -ForegroundColor Green
Write-Host "Your AI Cookbook is now accessible from any device with internet access!" -ForegroundColor Green
