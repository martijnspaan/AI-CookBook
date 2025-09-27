# PowerShell script to set up mobile access for AI Cookbook
# This script configures everything needed for the domain to be accessible from any device

param(
    [string]$ResourceGroup = "AI-CookBook",
    [string]$AksClusterName = "k8s-ai-cookbook",
    [string]$Domain = "108.141.86.181.nip.io",
    [string]$SubscriptionName = "Playground - masp",
    [string]$Email = "admin@example.com",  # Change this to your email for Let's Encrypt
    [string]$AzureContainerRegistry = "aicookbookregistry.azurecr.io",
    [string]$ImageTag = "1.0.0-test",
    [switch]$SkipImageBuild = $false,
    [switch]$SkipImagePush = $false
)

Write-Host "Setting up mobile access for AI Cookbook..." -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "AKS Cluster: $AksClusterName" -ForegroundColor Yellow
Write-Host "Container Registry: $AzureContainerRegistry" -ForegroundColor Yellow
Write-Host "Image Tag: $ImageTag" -ForegroundColor Yellow
Write-Host "Email for SSL: $Email" -ForegroundColor Yellow

# Check if required tools are available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed or not in PATH"
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH"
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

# Step 1: Deploy/Update the application if needed
if (-not $SkipImageBuild -or -not $SkipImagePush) {
    Write-Host "`n=== Step 1: Building and Deploying Application ===" -ForegroundColor Green
    
    # Change to k8s/test directory
    $originalLocation = Get-Location
    Set-Location "../k8s/test"
    
    # Run the deployment script with all required parameters
    Write-Host "Running application deployment..." -ForegroundColor Yellow
    
    # Build parameter hashtable for the deploy script (more reliable than array)
    $deployParams = @{
        AzureContainerRegistry = $AzureContainerRegistry
        ImageTag = $ImageTag
        ResourceGroup = $ResourceGroup
        AksClusterName = $AksClusterName
        SkipAzureSetup = $true
    }
    
    if ($SkipImageBuild) {
        $deployParams.SkipImageBuild = $true
    }
    
    if ($SkipImagePush) {
        $deployParams.SkipImagePush = $true
    }
    
    Write-Host "Calling deploy script with parameters:" -ForegroundColor Yellow
    $deployParams.GetEnumerator() | ForEach-Object { Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray }
    
    & "./deploy-test.ps1" @deployParams
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to deploy application"
        Set-Location $originalLocation
        exit 1
    }
    
    Set-Location $originalLocation
    Write-Host "Application deployment completed!" -ForegroundColor Green
}

# Step 2: Install cert-manager
Write-Host "`n=== Step 2: Installing cert-manager ===" -ForegroundColor Green

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

# Step 3: Create Let's Encrypt ClusterIssuer
Write-Host "`n=== Step 3: Creating Let's Encrypt ClusterIssuer ===" -ForegroundColor Green

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
    email: $Email
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

# Step 4: Configure DNS Records
Write-Host "`n=== Step 4: Configuring DNS Records ===" -ForegroundColor Green

# For Azure cloudapp domains, we need to ensure the load balancer gets a stable external IP
# The domain ai-cookbook-test.westeurope.cloudapp.azure.com will automatically resolve to this IP

Write-Host "Note: Using Azure-managed cloudapp domain - DNS is handled automatically" -ForegroundColor Yellow
Write-Host "The domain $Domain will resolve to the load balancer's external IP" -ForegroundColor Green

# Get the external IP of the ingress controller
Write-Host "Getting ingress controller external IP..." -ForegroundColor Yellow
$externalIP = kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null

if (-not $externalIP -or $externalIP -eq "") {
    Write-Warning "No external IP found for ingress controller. Waiting for load balancer to provision..."
    Write-Host "This may take a few minutes..." -ForegroundColor Yellow
    
    # Wait up to 10 minutes for external IP
    $maxWait = 60
    $waitCount = 0
    
    do {
        Start-Sleep -Seconds 10
        $waitCount++
        $externalIP = kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
        Write-Host "Waiting for external IP... (attempt $waitCount/$maxWait)" -ForegroundColor Yellow
    } while ((-not $externalIP -or $externalIP -eq "") -and $waitCount -lt $maxWait)
    
    if (-not $externalIP -or $externalIP -eq "") {
        Write-Error "External IP not available after waiting. Please check your ingress controller setup."
        exit 1
    }
}

Write-Host "External IP found: $externalIP" -ForegroundColor Green

# For Azure-managed domains like *.cloudapp.azure.com, DNS resolution is automatic
# The domain will resolve to the load balancer's external IP automatically
Write-Host "Azure-managed domain $Domain will automatically resolve to $externalIP" -ForegroundColor Green
Write-Host "No manual DNS configuration needed for Azure cloudapp domains" -ForegroundColor Yellow

# Step 5: Apply public ingress configuration
Write-Host "`n=== Step 5: Applying Public Ingress Configuration ===" -ForegroundColor Green

# Change to k8s/test directory
$originalLocation = Get-Location
Set-Location "../k8s/test"

# Apply the certificate resource
Write-Host "Applying certificate resource..." -ForegroundColor Yellow
kubectl apply -f certificate-public.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply certificate resource"
    Set-Location $originalLocation
    exit 1
}

# Check if existing ingress exists and delete it first
Write-Host "Checking for existing ingress configuration..." -ForegroundColor Yellow
$existingIngress = kubectl get ingress ai-cookbook-ingress-test -n ai-cookbook-test --ignore-not-found=true

if ($existingIngress) {
    Write-Host "Deleting existing ingress configuration..." -ForegroundColor Yellow
    kubectl delete ingress ai-cookbook-ingress-test -n ai-cookbook-test
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to delete existing ingress, but continuing..."
    } else {
        Write-Host "Existing ingress deleted successfully!" -ForegroundColor Green
    }
}

# Apply the public ingress configuration
Write-Host "Applying public ingress configuration..." -ForegroundColor Yellow
kubectl apply -f ingress-public.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply public ingress configuration"
    Set-Location $originalLocation
    exit 1
}

Write-Host "Public ingress configuration applied successfully!" -ForegroundColor Green

# Return to original directory
Set-Location $originalLocation

# Step 6: Wait for certificate to be issued
Write-Host "`n=== Step 6: Waiting for SSL Certificate ===" -ForegroundColor Green
Write-Host "Waiting for SSL certificate to be issued by Let's Encrypt..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

$maxAttempts = 60  # 10 minutes with 10-second intervals
$attempt = 0

do {
    $attempt++
    Write-Host "Checking certificate status (attempt $attempt/$maxAttempts)..." -ForegroundColor Yellow
    
    $certificateStatus = kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>$null
    
    if ($certificateStatus -eq "True") {
        Write-Host "SSL certificate issued successfully!" -ForegroundColor Green
        break
    } elseif ($certificateStatus -eq "False") {
        $reason = kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test -o jsonpath='{.status.conditions[?(@.type=="Ready")].message}' 2>$null
        Write-Host "Certificate issuance failed: $reason" -ForegroundColor Red
        Write-Host "You can check the certificate details with: kubectl describe certificate ai-cookbook-tls-public -n ai-cookbook-test" -ForegroundColor Cyan
        break
    }
    
    if ($attempt -ge $maxAttempts) {
        Write-Warning "Certificate issuance is taking longer than expected."
        Write-Host "You can check the status manually with: kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test" -ForegroundColor Cyan
        break
    }
    
    Start-Sleep -Seconds 10
} while ($true)

# Step 7: Display final status and access information
Write-Host "`n=== Final Status ===" -ForegroundColor Green

Write-Host "`n=== DNS Configuration ===" -ForegroundColor Yellow
Write-Host "External IP: $externalIP" -ForegroundColor White
Write-Host "Domain: $Domain (Azure cloudapp domain)" -ForegroundColor White
Write-Host "DNS Resolution: Automatic (Azure handles DNS for cloudapp.azure.com domains)" -ForegroundColor White

Write-Host "`n=== SSL Certificate Status ===" -ForegroundColor Yellow
kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test -o wide

Write-Host "`n=== Ingress Status ===" -ForegroundColor Yellow
kubectl get ingress -n ai-cookbook-test -o wide

Write-Host "`n=== Application Status ===" -ForegroundColor Yellow
kubectl get pods -n ai-cookbook-test

Write-Host "`n=== 🎉 SUCCESS! Your AI Cookbook is now accessible from any device! ===" -ForegroundColor Green
Write-Host "`n📱 Mobile Access URLs:" -ForegroundColor Cyan
Write-Host "  🌐 Web Application: https://$Domain" -ForegroundColor White
Write-Host "  🔌 API: https://$Domain/api" -ForegroundColor White
Write-Host "  📚 API Documentation: https://$Domain/swagger" -ForegroundColor White

Write-Host "`n📱 Testing Instructions:" -ForegroundColor Green
Write-Host "1. Test from your laptop browser: https://$Domain" -ForegroundColor White
Write-Host "2. Test from your Android device using the same URL" -ForegroundColor White
Write-Host "3. The SSL certificate should be trusted by all browsers" -ForegroundColor White
Write-Host "4. No security warnings should appear" -ForegroundColor White
Write-Host "5. Share the URL with friends/family to test from other devices" -ForegroundColor White

Write-Host "`n🔧 Troubleshooting:" -ForegroundColor Yellow
Write-Host "If the domain is not accessible:" -ForegroundColor White
Write-Host "1. Check DNS resolution: nslookup $Domain" -ForegroundColor White
Write-Host "2. Check ingress status: kubectl get ingress -n ai-cookbook-test" -ForegroundColor White
Write-Host "3. Check certificate status: kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test" -ForegroundColor White
Write-Host "4. Check ingress logs: kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx" -ForegroundColor White
Write-Host "5. Verify external IP: kubectl get svc -n ingress-nginx" -ForegroundColor White

Write-Host "`n📊 Monitoring:" -ForegroundColor Yellow
Write-Host "Monitor your application with:" -ForegroundColor White
Write-Host "  kubectl get pods -n ai-cookbook-test" -ForegroundColor White
Write-Host "  kubectl logs -f deployment/api-deployment-test -n ai-cookbook-test" -ForegroundColor White
Write-Host "  kubectl logs -f deployment/web-deployment-test -n ai-cookbook-test" -ForegroundColor White

Write-Host "`n🚀 Mobile access setup completed successfully!" -ForegroundColor Green
Write-Host "Your AI Cookbook is now accessible from any device with internet access!" -ForegroundColor Green
