# PowerShell script to generate TLS certificate for AI Cookbook test environment
# This script creates a self-signed certificate for the test domain

param(
    [string]$Domain = "ai-cookbook-test.westeurope.cloudapp.azure.com",
    [string]$OutputPath = "../k8s/test/certificates"
)

Write-Host "Generating TLS certificate for AI Cookbook test environment..." -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Yellow

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force
    Write-Host "Created directory: $OutputPath" -ForegroundColor Green
}

# Generate private key
$privateKeyPath = Join-Path $OutputPath "tls.key"
$certificatePath = Join-Path $OutputPath "tls.crt"

Write-Host "Generating private key..." -ForegroundColor Yellow
openssl genrsa -out $privateKeyPath 2048

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to generate private key. Please ensure OpenSSL is installed."
    exit 1
}

# Generate certificate signing request (CSR)
$csrPath = Join-Path $OutputPath "tls.csr"
Write-Host "Generating certificate signing request..." -ForegroundColor Yellow

# Create OpenSSL configuration file for the certificate
$configPath = Join-Path $OutputPath "openssl.conf"
$configContent = @"
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = Test State
L = Test City
O = AI Cookbook
OU = Test Environment
CN = $Domain

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $Domain
DNS.2 = ai-cookbook-test.westeurope.cloudapp.azure.com
DNS.3 = *.westeurope.cloudapp.azure.com
"@

Set-Content -Path $configPath -Value $configContent

# Generate CSR
openssl req -new -key $privateKeyPath -out $csrPath -config $configPath

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to generate certificate signing request."
    exit 1
}

# Generate self-signed certificate
Write-Host "Generating self-signed certificate..." -ForegroundColor Yellow
openssl x509 -req -in $csrPath -key $privateKeyPath -out $certificatePath -days 365 -extensions v3_req -extfile $configPath

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to generate self-signed certificate."
    exit 1
}

# Generate base64 encoded versions for Kubernetes
Write-Host "Generating base64 encoded certificates for Kubernetes..." -ForegroundColor Yellow

$certBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($certificatePath))
$keyBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($privateKeyPath))

# Create Kubernetes TLS secret YAML
$tlsSecretYaml = @"
apiVersion: v1
kind: Secret
metadata:
  name: ai-cookbook-tls-test
  namespace: ai-cookbook-test
  labels:
    app.kubernetes.io/name: ai-cookbook
    app.kubernetes.io/part-of: ai-cookbook
    app.kubernetes.io/version: "1.0.0"
    app.kubernetes.io/managed-by: kubectl
    app.kubernetes.io/component: tls
    app.kubernetes.io/environment: test
  annotations:
    description: "TLS certificate for AI Cookbook test environment ingress"
type: kubernetes.io/tls
data:
  tls.crt: "$certBase64"
  tls.key: "$keyBase64"
"@

$secretPath = Join-Path $OutputPath "tls-secret-test.yaml"
Set-Content -Path $secretPath -Value $tlsSecretYaml

Write-Host "`nCertificate generation completed successfully!" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "  Private Key: $privateKeyPath" -ForegroundColor White
Write-Host "  Certificate: $certificatePath" -ForegroundColor White
Write-Host "  Kubernetes Secret: $secretPath" -ForegroundColor White

Write-Host "`nCertificate details:" -ForegroundColor Yellow
openssl x509 -in $certificatePath -text -noout | Select-String -Pattern "Subject:|DNS:"

Write-Host "`nTo apply the certificate to Kubernetes:" -ForegroundColor Cyan
Write-Host "kubectl apply -f `"$secretPath`"" -ForegroundColor White

Write-Host "`nCertificate is valid for 365 days from now." -ForegroundColor Green
