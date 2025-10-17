# Force Cache Bust Script for Meal Week Planner
param(
    [string]$WebUrl = "http://localhost:8080",
    [string]$ApiUrl = "http://localhost:8081"
)

Write-Host "Force Cache Bust for Meal Week Planner" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Cache Busting Instructions:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. HARD REFRESH (Most Effective):" -ForegroundColor Yellow
Write-Host "   - Chrome/Edge: Ctrl+Shift+R or Ctrl+F5" -ForegroundColor White
Write-Host "   - Firefox: Ctrl+Shift+R or Ctrl+F5" -ForegroundColor White
Write-Host "   - Safari: Cmd+Shift+R" -ForegroundColor White
Write-Host ""

Write-Host "2. CLEAR BROWSER CACHE:" -ForegroundColor Yellow
Write-Host "   - Chrome: Settings > Privacy > Clear browsing data > Cached images and files" -ForegroundColor White
Write-Host "   - Firefox: Settings > Privacy > Clear Data > Cached Web Content" -ForegroundColor White
Write-Host "   - Edge: Settings > Privacy > Clear browsing data > Cached images and files" -ForegroundColor White
Write-Host ""

Write-Host "3. DISABLE CACHE (Developer Tools):" -ForegroundColor Yellow
Write-Host "   - Open Developer Tools (F12)" -ForegroundColor White
Write-Host "   - Go to Network tab" -ForegroundColor White
Write-Host "   - Check 'Disable cache' checkbox" -ForegroundColor White
Write-Host "   - Keep Developer Tools open while browsing" -ForegroundColor White
Write-Host ""

Write-Host "4. INCOGNITO/PRIVATE MODE:" -ForegroundColor Yellow
Write-Host "   - Open the application in incognito/private mode" -ForegroundColor White
Write-Host "   - This bypasses all cached content" -ForegroundColor White
Write-Host ""

Write-Host "5. MANUAL CACHE BUST:" -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
Write-Host "   - Add ?v=$timestamp to the URL" -ForegroundColor White
Write-Host "   - Example: $WebUrl?v=$timestamp" -ForegroundColor White
Write-Host ""

Write-Host "Current Application URLs:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Web Application: $WebUrl" -ForegroundColor Green
Write-Host "API Service: $ApiUrl" -ForegroundColor Green
Write-Host ""

Write-Host "If you continue to experience caching issues:" -ForegroundColor Red
Write-Host "1. Try a different browser" -ForegroundColor White
Write-Host "2. Clear all browser data for localhost" -ForegroundColor White
Write-Host "3. Restart your browser completely" -ForegroundColor White
Write-Host "4. Check if you have any browser extensions that cache content" -ForegroundColor White
Write-Host ""

Write-Host "Script completed!" -ForegroundColor Green