# Port Forwarding Script for Meal Week Planner
# This script sets up stable port forwards for the application

Write-Host "Starting Port Forwards for Meal Week Planner" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Kill any existing kubectl processes
Write-Host "`nCleaning up existing port forwards..." -ForegroundColor Yellow
$kubectlProcesses = Get-Process -Name "kubectl" -ErrorAction SilentlyContinue
if ($kubectlProcesses) {
    $kubectlProcesses | Stop-Process -Force
    Write-Host "✓ Cleaned up existing kubectl processes" -ForegroundColor Green
} else {
    Write-Host "✓ No existing kubectl processes found" -ForegroundColor Green
}

# Wait a moment for cleanup
Start-Sleep -Seconds 2

# Check if pods are running
Write-Host "`nChecking pod status..." -ForegroundColor Yellow
$webPod = kubectl get pods -l app=meal-week-planner-web --no-headers -o custom-columns=":metadata.name" 2>$null
$apiPod = kubectl get pods -l app=meal-week-planner-api --no-headers -o custom-columns=":metadata.name" 2>$null

if (-not $webPod) {
    Write-Host "✗ Web pod not found. Please ensure the application is deployed." -ForegroundColor Red
    exit 1
}

if (-not $apiPod) {
    Write-Host "✗ API pod not found. Please ensure the application is deployed." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Web pod: $webPod" -ForegroundColor Green
Write-Host "✓ API pod: $apiPod" -ForegroundColor Green

# Start port forwards
Write-Host "`nStarting port forwards..." -ForegroundColor Yellow

# Use different ports to avoid conflicts
$webPort = 8080
$apiPort = 8081

Write-Host "Starting web port forward (localhost:$webPort -> pod:4200)..." -ForegroundColor Cyan
Start-Process -FilePath "kubectl" -ArgumentList "port-forward", "--address", "0.0.0.0", "service/meal-week-planner-web-service", "$webPort`:4200" -WindowStyle Hidden -RedirectStandardOutput "nul" -RedirectStandardError "nul2"

Write-Host "Starting API port forward (localhost:$apiPort -> pod:4201)..." -ForegroundColor Cyan
Start-Process -FilePath "kubectl" -ArgumentList "port-forward", "--address", "0.0.0.0", "service/meal-week-planner-api-service", "$apiPort`:4201" -WindowStyle Hidden -RedirectStandardOutput "nul" -RedirectStandardError "nul2"

# Wait for port forwards to establish
Write-Host "`nWaiting for port forwards to establish..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test connections
Write-Host "`nTesting connections..." -ForegroundColor Yellow

# Test web application
$maxRetries = 5
$retryCount = 0
$webWorking = $false

while ($retryCount -lt $maxRetries -and -not $webWorking) {
    try {
        $webResponse = Invoke-WebRequest -Uri "http://localhost:$webPort" -UseBasicParsing -TimeoutSec 5
        if ($webResponse.StatusCode -eq 200) {
            $webWorking = $true
            Write-Host "✓ Web application is accessible on port $webPort" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        Write-Host "Retry $retryCount/$maxRetries for web application..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $webWorking) {
    Write-Host "✗ Web application is not accessible on port $webPort" -ForegroundColor Red
    Write-Host "Try running: kubectl port-forward service/meal-week-planner-web-service $webPort`:4200" -ForegroundColor Yellow
}

# Test API
$retryCount = 0
$apiWorking = $false

while ($retryCount -lt $maxRetries -and -not $apiWorking) {
    try {
        $apiResponse = Invoke-WebRequest -Uri "http://localhost:$apiPort/health" -UseBasicParsing -TimeoutSec 5
        if ($apiResponse.Content -eq "Healthy") {
            $apiWorking = $true
            Write-Host "✓ API is accessible on port $apiPort" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        Write-Host "Retry $retryCount/$maxRetries for API..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $apiWorking) {
    Write-Host "✗ API is not accessible on port $apiPort" -ForegroundColor Red
    Write-Host "Try running: kubectl port-forward service/meal-week-planner-api-service $apiPort`:4201" -ForegroundColor Yellow
}

if ($webWorking -and $apiWorking) {
    Write-Host "`n🎉 All services are running successfully!" -ForegroundColor Green
    Write-Host "`nApplication URLs:" -ForegroundColor Cyan
    Write-Host "Web Application: http://localhost:$webPort" -ForegroundColor White
    Write-Host "API Service: http://localhost:$apiPort" -ForegroundColor White
    Write-Host "API Health: http://localhost:$apiPort/health" -ForegroundColor White
    
    Write-Host "`nTo stop port forwards, run:" -ForegroundColor Yellow
    Write-Host "taskkill /f /im kubectl.exe" -ForegroundColor White
} else {
    Write-Host "`n❌ Some services are not accessible. Please check the error messages above." -ForegroundColor Red
}

Write-Host "`nScript completed!" -ForegroundColor Blue