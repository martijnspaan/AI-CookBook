# Docker Disk Space Management Script
# This script helps manage Docker Desktop disk usage

Write-Host "🐳 Docker Disk Space Management" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Function to show current disk usage
function Show-DockerDiskUsage {
    Write-Host "`n📊 Current Docker Disk Usage:" -ForegroundColor Yellow
    docker system df
}

# Function to clean up unused resources
function Clean-DockerResources {
    Write-Host "`n🧹 Cleaning Docker Resources..." -ForegroundColor Yellow
    
    # Remove unused containers
    Write-Host "Removing stopped containers..."
    docker container prune -f
    
    # Remove unused images
    Write-Host "Removing unused images..."
    docker image prune -f
    
    # Remove unused volumes
    Write-Host "Removing unused volumes..."
    docker volume prune -f
    
    # Remove build cache
    Write-Host "Removing build cache..."
    docker builder prune -f
    
    Write-Host "✅ Cleanup completed!" -ForegroundColor Green
}

# Function to set up automatic cleanup
function Setup-AutoCleanup {
    Write-Host "`n⚙️ Setting up automatic cleanup..." -ForegroundColor Yellow
    
    # Create a scheduled task for weekly cleanup
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-Command `"docker system prune -f --volumes`""
    $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2AM
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    
    try {
        Register-ScheduledTask -TaskName "DockerWeeklyCleanup" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Weekly Docker cleanup to manage disk space"
        Write-Host "✅ Weekly cleanup task created successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to show disk space recommendations
function Show-DiskRecommendations {
    Write-Host "`n💡 Disk Space Management Recommendations:" -ForegroundColor Yellow
    Write-Host "1. Set Docker Desktop disk image size limit to 60GB in Docker Desktop Settings"
    Write-Host "2. Enable 'Remove unused data' in Docker Desktop Settings"
    Write-Host "3. Regularly run 'docker system prune -f' to clean up"
    Write-Host "4. Monitor disk usage with 'docker system df'"
    Write-Host "5. Use multi-stage builds to reduce image sizes"
    Write-Host "6. Remove unused images and containers regularly"
}

# Main execution
Show-DockerDiskUsage
Show-DiskRecommendations

Write-Host "`n🛠️ Available Commands:" -ForegroundColor Cyan
Write-Host "1. Clean Docker resources now"
Write-Host "2. Setup automatic weekly cleanup"
Write-Host "3. Show current usage only"
Write-Host "4. Exit"

do {
    $choice = Read-Host "`nSelect an option (1-4)"
    
    switch ($choice) {
        "1" { Clean-DockerResources; Show-DockerDiskUsage }
        "2" { Setup-AutoCleanup }
        "3" { Show-DockerDiskUsage }
        "4" { Write-Host "Goodbye! 👋" -ForegroundColor Green; break }
        default { Write-Host "Invalid option. Please select 1-4." -ForegroundColor Red }
    }
} while ($choice -ne "4")
