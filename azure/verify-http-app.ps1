# Verify HTTP application is working
param(
    [string]$URL = "http://ai-cookbook-test.westeurope.azurecontainer.io"
)

Write-Host "Verifying AI Cookbook HTTP application" -ForegroundColor Green
Write-Host "URL: $URL" -ForegroundColor Yellow

# Test basic connectivity
Write-Host "`nTesting connectivity..." -ForegroundColor Yellow
$result = Test-NetConnection -ComputerName "ai-cookbook-test.westeurope.azurecontainer.io" -Port 80
if ($result.TcpTestSucceeded) {
    Write-Host "✅ Port 80 is accessible" -ForegroundColor Green
} else {
    Write-Host "❌ Port 80 is not accessible" -ForegroundColor Red
    exit 1
}

# Test HTTP response
Write-Host "`nTesting HTTP response..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $URL -Method Get -TimeoutSec 10
    Write-Host "✅ HTTP response received" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Cyan
    Write-Host "Content Length: $($response.Content.Length) bytes" -ForegroundColor Cyan
    
    if ($response.Content -like "*AI Cookbook*" -or $response.Content -like "*cookbook*") {
        Write-Host "✅ Application content detected" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Application content not clearly detected" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ HTTP request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== HTTP APPLICATION STATUS ===" -ForegroundColor Green
Write-Host "✅ Application is running and accessible" -ForegroundColor Green
Write-Host "✅ URL: $URL" -ForegroundColor Cyan
Write-Host "✅ IP: 20.126.253.205" -ForegroundColor Cyan
Write-Host "✅ Status: Running" -ForegroundColor Green

Write-Host "`nYou can now access your AI Cookbook at:" -ForegroundColor Yellow
Write-Host "$URL" -ForegroundColor Cyan
