# Setup script to create secrets configuration from template
param(
    [switch]$Force = $false
)

$templateFile = "secrets.config.example"
$secretsFile = "secrets.config"

Write-Host "AI Cookbook Secrets Configuration Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if secrets file already exists
if ((Test-Path $secretsFile) -and -not $Force) {
    Write-Host "Secrets configuration file already exists: $secretsFile" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite it? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Setup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Check if template exists
if (-not (Test-Path $templateFile)) {
    Write-Error "Template file not found: $templateFile"
    exit 1
}

# Copy template to secrets file
try {
    Copy-Item $templateFile $secretsFile -Force
    Write-Host "Created secrets configuration file: $secretsFile" -ForegroundColor Green
} catch {
    Write-Error "Failed to create secrets configuration file: $_"
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit '$secretsFile' and update with your actual values" -ForegroundColor White
Write-Host "2. Replace placeholder values with real configuration" -ForegroundColor White
Write-Host "3. Run your deployment scripts" -ForegroundColor White
Write-Host ""
Write-Host "Important:" -ForegroundColor Red
Write-Host "- Never commit '$secretsFile' to git (it's already in .gitignore)" -ForegroundColor Yellow
Write-Host "- Keep your secrets secure and rotate them regularly" -ForegroundColor Yellow
Write-Host ""
Write-Host "For detailed instructions, see README-SECRETS.md" -ForegroundColor Cyan
