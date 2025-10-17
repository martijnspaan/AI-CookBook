# Cache Busting Script for Meal Week Planner
# This script helps clear browser cache and force reload of the application

Write-Host "Cache Busting Script for Meal Week Planner" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if port forwards are running
Write-Host "`nChecking port forwards..." -ForegroundColor Yellow

$webPort = 8080
$apiPort = 8081

# Test web application
try {
    $webResponse = Invoke-WebRequest -Uri "http://localhost:$webPort" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Web application is accessible on port $webPort" -ForegroundColor Green
} catch {
    Write-Host "✗ Web application is not accessible on port $webPort" -ForegroundColor Red
    Write-Host "Please run: kubectl port-forward service/meal-week-planner-web-service $webPort`:$webPort" -ForegroundColor Yellow
    exit 1
}

# Test API
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:$apiPort/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ API is accessible on port $apiPort" -ForegroundColor Green
} catch {
    Write-Host "✗ API is not accessible on port $apiPort" -ForegroundColor Red
    Write-Host "Please run: kubectl port-forward service/meal-week-planner-api-service $apiPort`:$apiPort" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nCache Busting Instructions:" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Hard Refresh (Recommended):" -ForegroundColor Cyan
Write-Host "   - Chrome/Edge: Ctrl+Shift+R" -ForegroundColor White
Write-Host "   - Firefox: Ctrl+F5" -ForegroundColor White
Write-Host "   - Safari: Cmd+Shift+R" -ForegroundColor White
Write-Host ""
Write-Host "2. Clear Browser Cache:" -ForegroundColor Cyan
Write-Host "   - Open Developer Tools (F12)" -ForegroundColor White
Write-Host "   - Right-click refresh button" -ForegroundColor White
Write-Host "   - Select 'Empty Cache and Hard Reload'" -ForegroundColor White
Write-Host ""
Write-Host "3. Incognito/Private Mode:" -ForegroundColor Cyan
Write-Host "   - Open a new incognito/private window" -ForegroundColor White
Write-Host "   - Navigate to http://localhost:$webPort" -ForegroundColor White
Write-Host ""
Write-Host "4. Force Service Worker Update:" -ForegroundColor Cyan
Write-Host "   - Open Developer Tools (F12)" -ForegroundColor White
Write-Host "   - Go to Application tab > Service Workers" -ForegroundColor White
Write-Host "   - Click 'Update' or 'Unregister'" -ForegroundColor White
Write-Host "   - Reload the page" -ForegroundColor White

Write-Host "`nApplication URLs:" -ForegroundColor Green
Write-Host "Web Application: http://localhost:$webPort" -ForegroundColor White
Write-Host "API Service: http://localhost:$apiPort" -ForegroundColor White
Write-Host "API Health: http://localhost:$apiPort/health" -ForegroundColor White

Write-Host "`nIf you still don't see changes after trying these steps:" -ForegroundColor Yellow
Write-Host "- The nginx configuration now uses shorter cache times (1 hour for JS/CSS)" -ForegroundColor White
Write-Host "- HTML files are set to no-cache" -ForegroundColor White
Write-Host "- Try waiting a few minutes and then hard refresh" -ForegroundColor White

Write-Host "`nScript completed!" -ForegroundColor Blue
