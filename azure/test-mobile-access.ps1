# PowerShell script to test mobile access for AI Cookbook
# This script tests the domain accessibility from various perspectives

param(
    [string]$Domain = "ai-cookbook-test.westeurope.cloudapp.azure.com"
)

Write-Host "Testing mobile access for AI Cookbook..." -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Yellow

# Check if required tools are available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

# Test 1: DNS Resolution
Write-Host "`n=== Test 1: DNS Resolution ===" -ForegroundColor Green
try {
    $dnsResult = nslookup $Domain 2>$null | Select-String "Address:"
    if ($dnsResult) {
        Write-Host "✅ DNS resolution successful!" -ForegroundColor Green
        Write-Host "Resolved to: $dnsResult" -ForegroundColor White
    } else {
        Write-Host "❌ DNS resolution failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ DNS resolution failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Kubernetes Ingress Status
Write-Host "`n=== Test 2: Kubernetes Ingress Status ===" -ForegroundColor Green
try {
    $ingressStatus = kubectl get ingress -n ai-cookbook-test -o wide
    if ($ingressStatus) {
        Write-Host "✅ Ingress configuration found:" -ForegroundColor Green
        Write-Host $ingressStatus -ForegroundColor White
        
        # Check if ingress has external IP
        $externalIP = kubectl get ingress ai-cookbook-ingress-public -n ai-cookbook-test -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
        if ($externalIP) {
            Write-Host "✅ External IP assigned: $externalIP" -ForegroundColor Green
        } else {
            Write-Host "⚠️  External IP not yet assigned (may still be provisioning)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ No ingress configuration found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to check ingress status: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: SSL Certificate Status
Write-Host "`n=== Test 3: SSL Certificate Status ===" -ForegroundColor Green
try {
    $certStatus = kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test -o wide 2>$null
    if ($certStatus) {
        Write-Host "✅ Certificate resource found:" -ForegroundColor Green
        Write-Host $certStatus -ForegroundColor White
        
        # Check certificate ready status
        $certReady = kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>$null
        if ($certReady -eq "True") {
            Write-Host "✅ SSL certificate is ready!" -ForegroundColor Green
        } elseif ($certReady -eq "False") {
            Write-Host "❌ SSL certificate is not ready" -ForegroundColor Red
            $reason = kubectl get certificate ai-cookbook-tls-public -n ai-cookbook-test -o jsonpath='{.status.conditions[?(@.type=="Ready")].message}' 2>$null
            Write-Host "Reason: $reason" -ForegroundColor Red
        } else {
            Write-Host "⚠️  SSL certificate status unknown" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ No certificate resource found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to check certificate status: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Application Pods Status
Write-Host "`n=== Test 4: Application Pods Status ===" -ForegroundColor Green
try {
    $pods = kubectl get pods -n ai-cookbook-test -o wide
    if ($pods) {
        Write-Host "✅ Application pods status:" -ForegroundColor Green
        Write-Host $pods -ForegroundColor White
        
        # Check if pods are running
        $runningPods = kubectl get pods -n ai-cookbook-test --field-selector=status.phase=Running -o name | Measure-Object | Select-Object -ExpandProperty Count
        if ($runningPods -gt 0) {
            Write-Host "✅ $runningPods pods are running" -ForegroundColor Green
        } else {
            Write-Host "❌ No pods are running" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ No application pods found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to check pods status: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: HTTP/HTTPS Connectivity
Write-Host "`n=== Test 5: HTTP/HTTPS Connectivity ===" -ForegroundColor Green

# Test HTTPS
try {
    Write-Host "Testing HTTPS connection..." -ForegroundColor Yellow
    $httpsResponse = Invoke-WebRequest -Uri "https://$Domain" -TimeoutSec 30 -UseBasicParsing -SkipCertificateCheck 2>$null
    
    if ($httpsResponse.StatusCode -eq 200) {
        Write-Host "✅ HTTPS connection successful! Status: $($httpsResponse.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  HTTPS connection returned status: $($httpsResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*certificate*") {
        Write-Host "⚠️  HTTPS connection failed due to certificate issues (may be normal during setup)" -ForegroundColor Yellow
    } elseif ($errorMessage -like "*timeout*") {
        Write-Host "⚠️  HTTPS connection timed out (may still be provisioning)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ HTTPS connection failed: $errorMessage" -ForegroundColor Red
    }
}

# Test HTTP (should redirect to HTTPS)
try {
    Write-Host "Testing HTTP connection (should redirect to HTTPS)..." -ForegroundColor Yellow
    $httpResponse = Invoke-WebRequest -Uri "http://$Domain" -TimeoutSec 30 -UseBasicParsing -MaximumRedirection 0 2>$null
    
    if ($httpResponse.StatusCode -eq 301 -or $httpResponse.StatusCode -eq 302) {
        Write-Host "✅ HTTP redirect to HTTPS working! Status: $($httpResponse.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  HTTP response status: $($httpResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*redirect*") {
        Write-Host "✅ HTTP redirect is working (caught redirect exception)" -ForegroundColor Green
    } else {
        Write-Host "❌ HTTP connection failed: $errorMessage" -ForegroundColor Red
    }
}

# Test 6: API Endpoint
Write-Host "`n=== Test 6: API Endpoint ===" -ForegroundColor Green
try {
    Write-Host "Testing API endpoint..." -ForegroundColor Yellow
    $apiResponse = Invoke-WebRequest -Uri "https://$Domain/api/health" -TimeoutSec 30 -UseBasicParsing -SkipCertificateCheck 2>$null
    
    if ($apiResponse.StatusCode -eq 200) {
        Write-Host "✅ API endpoint accessible! Status: $($apiResponse.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  API endpoint returned status: $($apiResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*404*") {
        Write-Host "⚠️  API endpoint not found (may not have health endpoint)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ API endpoint failed: $errorMessage" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Yellow
Write-Host "`n📱 Mobile Access URLs:" -ForegroundColor Cyan
Write-Host "  🌐 Web Application: https://$Domain" -ForegroundColor White
Write-Host "  🔌 API: https://$Domain/api" -ForegroundColor White
Write-Host "  📚 API Documentation: https://$Domain/swagger" -ForegroundColor White

Write-Host "`n📱 Manual Testing Instructions:" -ForegroundColor Green
Write-Host "1. Open your Android device's browser" -ForegroundColor White
Write-Host "2. Navigate to: https://$Domain" -ForegroundColor White
Write-Host "3. The site should load without security warnings" -ForegroundColor White
Write-Host "4. Test the API by going to: https://$Domain/swagger" -ForegroundColor White
Write-Host "5. Share the URL with friends to test from other devices" -ForegroundColor White

Write-Host "`n🔧 If issues persist:" -ForegroundColor Yellow
Write-Host "1. Wait a few more minutes for DNS propagation and certificate issuance" -ForegroundColor White
Write-Host "2. Check the setup script output for any errors" -ForegroundColor White
Write-Host "3. Verify your Azure resources are running correctly" -ForegroundColor White
Write-Host "4. Check the troubleshooting section in the setup script" -ForegroundColor White

Write-Host "`nMobile access testing completed!" -ForegroundColor Green
