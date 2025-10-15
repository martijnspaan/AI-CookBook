# PowerShell script to clean up Docker and reduce data.vhdx size
# This script will help reduce Docker disk usage from 42GB to a more reasonable size

param(
    [switch]$Force = $false,
    [switch]$DryRun = $false
)

Write-Host "Docker Cleanup Script" -ForegroundColor Green
Write-Host "This script will help reduce your Docker data.vhdx from 42GB to a more reasonable size" -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "DRY RUN MODE - No changes will be made" -ForegroundColor Cyan
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

# Step 1: Analyze current disk usage
Write-Host "`n=== Step 1: Analyzing Current Disk Usage ===" -ForegroundColor Green

Write-Host "Docker system information:" -ForegroundColor Yellow
docker system df

Write-Host "`nDocker images:" -ForegroundColor Yellow
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

Write-Host "`nDocker containers (all):" -ForegroundColor Yellow
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"

# Step 2: Clean up stopped containers
Write-Host "`n=== Step 2: Cleaning Up Stopped Containers ===" -ForegroundColor Green

$stoppedContainers = docker ps -a --filter "status=exited" --format "{{.Names}}"
if ($stoppedContainers) {
    Write-Host "Found stopped containers:" -ForegroundColor Yellow
    $stoppedContainers | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    
    if (-not $DryRun) {
        if ($Force -or (Read-Host "Remove stopped containers? (y/N)") -eq "y") {
            Write-Host "Removing stopped containers..." -ForegroundColor Yellow
            docker container prune -f
            Write-Host "Stopped containers removed!" -ForegroundColor Green
        }
    } else {
        Write-Host "Would remove stopped containers" -ForegroundColor Cyan
    }
} else {
    Write-Host "No stopped containers found" -ForegroundColor Green
}

# Step 3: Clean up unused images
Write-Host "`n=== Step 3: Cleaning Up Unused Images ===" -ForegroundColor Green

$danglingImages = docker images --filter "dangling=true" --format "{{.ID}}"
if ($danglingImages) {
    Write-Host "Found dangling images:" -ForegroundColor Yellow
    docker images --filter "dangling=true" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    if (-not $DryRun) {
        if ($Force -or (Read-Host "Remove dangling images? (y/N)") -eq "y") {
            Write-Host "Removing dangling images..." -ForegroundColor Yellow
            docker image prune -f
            Write-Host "Dangling images removed!" -ForegroundColor Green
        }
    } else {
        Write-Host "Would remove dangling images" -ForegroundColor Cyan
    }
} else {
    Write-Host "No dangling images found" -ForegroundColor Green
}

# Step 4: Clean up unused volumes
Write-Host "`n=== Step 4: Cleaning Up Unused Volumes ===" -ForegroundColor Green

$unusedVolumes = docker volume ls --filter "dangling=true" --format "{{.Name}}"
if ($unusedVolumes) {
    Write-Host "Found unused volumes:" -ForegroundColor Yellow
    docker volume ls --filter "dangling=true" --format "table {{.Driver}}\t{{.Name}}"
    
    if (-not $DryRun) {
        if ($Force -or (Read-Host "Remove unused volumes? (y/N)") -eq "y") {
            Write-Host "Removing unused volumes..." -ForegroundColor Yellow
            docker volume prune -f
            Write-Host "Unused volumes removed!" -ForegroundColor Green
        }
    } else {
        Write-Host "Would remove unused volumes" -ForegroundColor Cyan
    }
} else {
    Write-Host "No unused volumes found" -ForegroundColor Green
}

# Step 5: Clean up build cache
Write-Host "`n=== Step 5: Cleaning Up Build Cache ===" -ForegroundColor Green

if (-not $DryRun) {
    if ($Force -or (Read-Host "Remove build cache? (y/N)") -eq "y") {
        Write-Host "Removing build cache..." -ForegroundColor Yellow
        docker builder prune -f
        Write-Host "Build cache removed!" -ForegroundColor Green
    }
} else {
    Write-Host "Would remove build cache" -ForegroundColor Cyan
}

# Step 6: Remove specific large images (optional)
Write-Host "`n=== Step 6: Analyzing Large Images ===" -ForegroundColor Green

$largeImages = docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}" | Where-Object { $_ -match "GB|MB" -and $_ -notmatch "ai-cookbook" }
if ($largeImages) {
    Write-Host "Large images found:" -ForegroundColor Yellow
    $largeImages | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    
    if (-not $DryRun) {
        Write-Host "You can remove specific images with: docker rmi <image_name>" -ForegroundColor Cyan
    }
} else {
    Write-Host "No unusually large images found" -ForegroundColor Green
}

# Step 7: System-wide cleanup
Write-Host "`n=== Step 7: System-wide Cleanup ===" -ForegroundColor Green

if (-not $DryRun) {
    if ($Force -or (Read-Host "Perform system-wide cleanup? (y/N)") -eq "y") {
        Write-Host "Performing system-wide cleanup..." -ForegroundColor Yellow
        docker system prune -a -f --volumes
        Write-Host "System-wide cleanup completed!" -ForegroundColor Green
    }
} else {
    Write-Host "Would perform system-wide cleanup" -ForegroundColor Cyan
}

# Step 8: Show final disk usage
Write-Host "`n=== Step 8: Final Disk Usage ===" -ForegroundColor Green

Write-Host "Docker system information after cleanup:" -ForegroundColor Yellow
docker system df

# Step 9: Recommendations for preventing future bloat
Write-Host "`n=== Step 9: Recommendations ===" -ForegroundColor Green

Write-Host "To prevent future Docker bloat:" -ForegroundColor Yellow
Write-Host "1. Regularly run: docker system prune" -ForegroundColor White
Write-Host "2. Use .dockerignore files to reduce build context" -ForegroundColor White
Write-Host "3. Use multi-stage builds efficiently" -ForegroundColor White
Write-Host "4. Remove unused images after builds" -ForegroundColor White
Write-Host "5. Set up automated cleanup in CI/CD" -ForegroundColor White

Write-Host "`nDocker cleanup completed!" -ForegroundColor Green
Write-Host "Your data.vhdx should now be significantly smaller." -ForegroundColor Green
