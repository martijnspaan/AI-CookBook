# PowerShell script to test HTTPS configuration for AI Cookbook test environment

param(
    [string]$Domain = "ai-cookbook-test.westeurope.cloudapp.azure.com"
)

Write-Host "Testing HTTPS configuration for AI Cookbook test environment..." -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Yellow

# Test HTTPS endpoints
$endpoints = @(
    @{ Path = "/"; Name = "Web Application" },
    @{ Path = "/api"; Name = "API Root" },
    @{ Path = "/swagger"; Name = "API Swagger" }
)

foreach ($endpoint in $endpoints) {
    $url = "https://$Domain$($endpoint.Path)"
    Write-Host "`nTesting $($endpoint.Name): $url" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 -SkipCertificateCheck
        Write-Host "  Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
        Write-Host "  Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor White
        
        if ($response.Headers.'Strict-Transport-Security') {
            Write-Host "  HSTS: $($response.Headers.'Strict-Transport-Security')" -ForegroundColor Green
        } else {
            Write-Host "  HSTS: Not configured" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Message -like "*certificate*") {
            Write-Host "  Note: This is likely due to a self-signed certificate. The application is working but the browser will show a security warning." -ForegroundColor Yellow
        }
    }
}

# Test HTTP redirect to HTTPS
Write-Host "`nTesting HTTP to HTTPS redirect..." -ForegroundColor Cyan
$httpUrl = "http://$Domain"
try {
    $response = Invoke-WebRequest -Uri $httpUrl -UseBasicParsing -TimeoutSec 30 -MaximumRedirection 0
    Write-Host "  HTTP Status: $($response.StatusCode)" -ForegroundColor Yellow
    Write-Host "  Note: HTTP is not redirecting to HTTPS. This may be expected depending on your configuration." -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 301 -or $_.Exception.Response.StatusCode -eq 302) {
        $location = $_.Exception.Response.Headers.Location
        Write-Host "  Redirect Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
        Write-Host "  Redirect Location: $location" -ForegroundColor Green
    } else {
        Write-Host "  HTTP Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nHTTPS testing completed!" -ForegroundColor Green
Write-Host "If you see certificate warnings in your browser, this is expected for a self-signed certificate." -ForegroundColor Yellow
Write-Host "You can safely proceed by clicking 'Advanced' and 'Proceed to site'." -ForegroundColor Yellow
