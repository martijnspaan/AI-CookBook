# Emergency Docker cleanup script - Use when data.vhdx is very large (40GB+)
# WARNING: This will remove ALL unused Docker data

param(
    [switch]$Force = $false
)

Write-Host "EMERGENCY Docker Cleanup Script" -ForegroundColor Red
Write-Host "WARNING: This will remove ALL unused Docker data!" -ForegroundColor Red
Write-Host "This should reduce your data.vhdx from 42GB to under 10GB" -ForegroundColor Yellow

if (-not $Force) {
    $confirm = Read-Host "Are you sure you want to proceed? Type 'CLEANUP' to confirm"
    if ($confirm -ne "CLEANUP") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Check if Docker is running
Write-Host "`n=== Checking Docker Status ===" -ForegroundColor Green
try {
    $dockerVersion = docker --version
    Write-Host "Docker is running: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Error "Docker is not running or not installed. Please start Docker Desktop first."
    exit 1
}

# Show current usage
Write-Host "`n=== Current Docker Usage ===" -ForegroundColor Green
docker system df

# Step 1: Stop all running containers
Write-Host "`n=== Step 1: Stopping All Containers ===" -ForegroundColor Green
$runningContainers = docker ps -q
if ($runningContainers) {
    Write-Host "Stopping running containers..." -ForegroundColor Yellow
    docker stop $runningContainers
    Write-Host "All containers stopped!" -ForegroundColor Green
} else {
    Write-Host "No running containers found" -ForegroundColor Green
}

# Step 2: Remove all containers
Write-Host "`n=== Step 2: Removing All Containers ===" -ForegroundColor Green
Write-Host "Removing all containers..." -ForegroundColor Yellow
docker container prune -f
Write-Host "All containers removed!" -ForegroundColor Green

# Step 3: Remove all images except ai-cookbook
Write-Host "`n=== Step 3: Removing Non-Essential Images ===" -ForegroundColor Green
Write-Host "Removing all images except ai-cookbook..." -ForegroundColor Yellow

# Get all images except ai-cookbook
$imagesToRemove = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -notmatch "ai-cookbook" -and $_ -ne "<none>:<none>" }
if ($imagesToRemove) {
    $imagesToRemove | ForEach-Object {
        Write-Host "Removing image: $_" -ForegroundColor Gray
        docker rmi $_ -f 2>$null
    }
    Write-Host "Non-essential images removed!" -ForegroundColor Green
} else {
    Write-Host "No non-essential images found" -ForegroundColor Green
}

# Step 4: Remove all volumes
Write-Host "`n=== Step 4: Removing All Volumes ===" -ForegroundColor Green
Write-Host "Removing all volumes..." -ForegroundColor Yellow
docker volume prune -f
Write-Host "All volumes removed!" -ForegroundColor Green

# Step 5: Remove all networks
Write-Host "`n=== Step 5: Removing Unused Networks ===" -ForegroundColor Green
Write-Host "Removing unused networks..." -ForegroundColor Yellow
docker network prune -f
Write-Host "Unused networks removed!" -ForegroundColor Green

# Step 6: Remove build cache
Write-Host "`n=== Step 6: Removing Build Cache ===" -ForegroundColor Green
Write-Host "Removing build cache..." -ForegroundColor Yellow
docker builder prune -a -f
Write-Host "Build cache removed!" -ForegroundColor Green

# Step 7: System-wide cleanup
Write-Host "`n=== Step 7: Final System Cleanup ===" -ForegroundColor Green
Write-Host "Performing final system cleanup..." -ForegroundColor Yellow
docker system prune -a -f --volumes
Write-Host "Final cleanup completed!" -ForegroundColor Green

# Step 8: Show final usage
Write-Host "`n=== Final Docker Usage ===" -ForegroundColor Green
docker system df

# Step 9: Show remaining images
Write-Host "`n=== Remaining Images ===" -ForegroundColor Green
docker images

Write-Host "`n=== Emergency Cleanup Completed! ===" -ForegroundColor Green
Write-Host "Your data.vhdx should now be significantly smaller (under 10GB)" -ForegroundColor Green
Write-Host "You can now retry the ACI deployment" -ForegroundColor Green
