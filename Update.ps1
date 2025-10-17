# Meal Week Planner Deployment Script
# This script builds, deploys, and manages the Meal Week Planner application on Kind

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "web", "api", "clean", "status", "logs")]
    [string]$Component = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$ImageTag = "latest",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

# Configuration
$CLUSTER_NAME = "meal-week-planner"
$API_IMAGE = "meal-week-planner-api"
$WEB_IMAGE = "meal-week-planner-web"
$API_PORT = 4201
$WEB_PORT = 4200

# Colors for output
$RED = "Red"
$GREEN = "Green"
$YELLOW = "Yellow"
$BLUE = "Cyan"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-ColorOutput "Checking prerequisites..." $BLUE
    
    # Check if Kind cluster exists
    $clusterExists = kind get clusters | Where-Object { $_ -eq $CLUSTER_NAME }
    if (-not $clusterExists) {
        Write-ColorOutput "ERROR: Kind cluster '$CLUSTER_NAME' not found. Please create it first using kind-config.yaml" $RED
        exit 1
    }
    
    # Check if kubectl is configured
    $kubectlContext = kubectl config current-context
    if ($kubectlContext -ne "kind-$CLUSTER_NAME") {
        Write-ColorOutput "WARNING: Setting kubectl context to kind-$CLUSTER_NAME" $YELLOW
        kubectl config use-context "kind-$CLUSTER_NAME"
    }
    
    # Check if Docker is running
    try {
        docker version | Out-Null
    }
    catch {
        Write-ColorOutput "ERROR: Docker is not running. Please start Docker Desktop." $RED
        exit 1
    }
    
    Write-ColorOutput "Prerequisites check passed" $GREEN
}

function Build-Image {
    param(
        [string]$ImageName,
        [string]$ImageTag,
        [string]$BuildPath,
        [string]$DockerfileName = "Dockerfile"
    )
    
    Write-ColorOutput "Building ${ImageName}:${ImageTag}..." $BLUE
    
    $fullImageName = "$ImageName`:$ImageTag"
    $dockerfilePath = Join-Path $BuildPath $DockerfileName
    
    if (-not (Test-Path $dockerfilePath)) {
        Write-ColorOutput "ERROR: Dockerfile not found at $dockerfilePath" $RED
        exit 1
    }
    
    try {
        docker build -t $fullImageName -f $dockerfilePath $BuildPath
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "ERROR: Failed to build $ImageName" $RED
            exit 1
        }
        
        Write-ColorOutput "Successfully built ${ImageName}:${ImageTag}" $GREEN
        return $fullImageName
    }
    catch {
        Write-ColorOutput "ERROR: Error building $ImageName`: $($_.Exception.Message)" $RED
        exit 1
    }
}

function Load-ImageToKind {
    param(
        [string]$ImageName,
        [string]$ImageTag
    )
    
    Write-ColorOutput "Loading ${ImageName}:${ImageTag} to Kind cluster..." $BLUE
    
    $fullImageName = "$ImageName`:$ImageTag"
    
    try {
        kind load docker-image $fullImageName --name $CLUSTER_NAME
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "ERROR: Failed to load $ImageName to Kind cluster" $RED
            exit 1
        }
        
        Write-ColorOutput "Successfully loaded ${ImageName}:${ImageTag} to Kind cluster" $GREEN
    }
    catch {
        Write-ColorOutput "ERROR: Error loading $ImageName to Kind: $($_.Exception.Message)" $RED
        exit 1
    }
}

function Deploy-Secrets {
    Write-ColorOutput "Setting up secrets..." $BLUE
    
    if (Test-Path "secrets.env") {
        try {
            & "scripts/setup-secrets.ps1" -ClusterName $CLUSTER_NAME
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "Secrets setup completed" $GREEN
            } else {
                Write-ColorOutput "WARNING: Secrets setup failed, continuing with deployment" $YELLOW
            }
        }
        catch {
            Write-ColorOutput "WARNING: Error setting up secrets: $($_.Exception.Message)" $YELLOW
        }
    } else {
        Write-ColorOutput "WARNING: secrets.env not found, skipping secrets setup" $YELLOW
    }
}

function Deploy-Application {
    param(
        [string]$ManifestPath,
        [string]$AppName,
        [string]$DeploymentName
    )
    
    Write-ColorOutput "Deploying $AppName..." $BLUE
    
    if (-not (Test-Path $ManifestPath)) {
        Write-ColorOutput "ERROR: Manifest file not found at $ManifestPath" $RED
        exit 1
    }
    
    try {
        kubectl apply -f $ManifestPath
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "ERROR: Failed to deploy $AppName" $RED
            exit 1
        }
        
        # Force rollout restart to ensure pods pick up latest images
        Write-ColorOutput "Restarting deployment $DeploymentName to pick up latest images..." $BLUE
        kubectl rollout restart deployment/$DeploymentName
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "WARNING: Failed to restart deployment $DeploymentName" $YELLOW
        } else {
            Write-ColorOutput "Successfully restarted deployment $DeploymentName" $GREEN
        }
        
        Write-ColorOutput "Successfully deployed $AppName" $GREEN
    }
    catch {
        Write-ColorOutput "ERROR: Error deploying $AppName`: $($_.Exception.Message)" $RED
        exit 1
    }
}

function Wait-For-Deployment {
    param(
        [string]$DeploymentName,
        [int]$TimeoutSeconds = 120
    )
    
    Write-ColorOutput "Waiting for $DeploymentName to be ready..." $BLUE
    
    try {
        kubectl wait --for=condition=available --timeout=${TimeoutSeconds}s deployment/$DeploymentName
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "$DeploymentName is ready" $GREEN
        } else {
            Write-ColorOutput "WARNING: $DeploymentName deployment timeout or failed" $YELLOW
        }
    }
    catch {
        Write-ColorOutput "WARNING: Error waiting for $DeploymentName`: $($_.Exception.Message)" $YELLOW
    }
}

function Show-Status {
    Write-ColorOutput "Deployment Status:" $BLUE
    Write-ColorOutput "===================" $BLUE
    
    # Show cluster info
    Write-ColorOutput "`nCluster Information:" $YELLOW
    kubectl cluster-info --context "kind-$CLUSTER_NAME"
    
    # Show deployments
    Write-ColorOutput "`nDeployments:" $YELLOW
    kubectl get deployments -o wide
    
    # Show services
    Write-ColorOutput "`nServices:" $YELLOW
    kubectl get services -o wide
    
    # Show pods
    Write-ColorOutput "`nPods:" $YELLOW
    kubectl get pods -o wide
    
    # Show access URLs
    Write-ColorOutput "`nAccess URLs:" $YELLOW
    Write-ColorOutput "Web Application: http://localhost:$WEB_PORT" $GREEN
    Write-ColorOutput "API Service: http://localhost:$API_PORT" $GREEN
    Write-ColorOutput "API Health: http://localhost:$API_PORT/health" $GREEN
}

function Show-Logs {
    param(
        [string]$Component
    )
    
    switch ($Component.ToLower()) {
        "web" {
            Write-ColorOutput "Web Application Logs:" $BLUE
            kubectl logs -l app=meal-week-planner-web --tail=50
        }
        "api" {
            Write-ColorOutput "API Application Logs:" $BLUE
            kubectl logs -l app=meal-week-planner-api --tail=50
        }
        default {
            Write-ColorOutput "All Application Logs:" $BLUE
            kubectl logs -l app=meal-week-planner-web --tail=20
            Write-ColorOutput "`n--- API Logs ---" $YELLOW
            kubectl logs -l app=meal-week-planner-api --tail=20
        }
    }
}

function Clean-Deployment {
    Write-ColorOutput "Cleaning up deployment..." $BLUE
    
    try {
        # Remove deployments and services
        kubectl delete -f deploy/k8s/web-deployment.yaml --ignore-not-found=true
        kubectl delete -f deploy/k8s/api-deployment.yaml --ignore-not-found=true
        
        # Clean up Docker images
        if ($Force) {
            docker rmi "$API_IMAGE`:$ImageTag" --force 2>$null
            docker rmi "$WEB_IMAGE`:$ImageTag" --force 2>$null
        }
        
        Write-ColorOutput "Cleanup completed" $GREEN
    }
    catch {
        Write-ColorOutput "WARNING: Cleanup completed with warnings: $($_.Exception.Message)" $YELLOW
    }
}

# Main execution logic
Write-ColorOutput "Meal Week Planner Deployment Script" $BLUE
Write-ColorOutput "=====================================" $BLUE

switch ($Component.ToLower()) {
    "status" {
        Test-Prerequisites
        Show-Status
    }
    "logs" {
        Test-Prerequisites
        Show-Logs
    }
    "clean" {
        Clean-Deployment
    }
    "web" {
        Test-Prerequisites
        if (-not $SkipBuild) {
            Build-Image $WEB_IMAGE $ImageTag "Web" | Out-Null
            Load-ImageToKind $WEB_IMAGE $ImageTag
        }
        Deploy-Application "deploy/k8s/web-deployment.yaml" "Web Application" "meal-week-planner-web"
        Wait-For-Deployment "meal-week-planner-web"
        Write-ColorOutput "Forcing service worker update check..." $BLUE
        Start-Sleep -Seconds 5  # Wait for pod to be fully ready
        try {
            # Trigger service worker update check via the Angular service worker API
            Invoke-WebRequest -Uri "http://localhost/ngsw/state" -UseBasicParsing | Out-Null
            Write-ColorOutput "Service worker update check triggered" $GREEN
        } catch {
            Write-ColorOutput "WARNING: Could not trigger service worker update check" $YELLOW
        }
        Show-Status
    }
    "api" {
        Test-Prerequisites
        Deploy-Secrets
        if (-not $SkipBuild) {
            Build-Image $API_IMAGE $ImageTag "API" | Out-Null
            Load-ImageToKind $API_IMAGE $ImageTag
        }
        Deploy-Application "deploy/k8s/api-deployment.yaml" "API Application" "meal-week-planner-api"
        Wait-For-Deployment "meal-week-planner-api"
        Show-Status
    }
    "all" {
        Test-Prerequisites
        Deploy-Secrets
        
        if (-not $SkipBuild) {
            # Build both images
            $apiImage = Build-Image $API_IMAGE $ImageTag "API"
            $webImage = Build-Image $WEB_IMAGE $ImageTag "Web"
            
            # Load images to Kind
            Load-ImageToKind $API_IMAGE $ImageTag
            Load-ImageToKind $WEB_IMAGE $ImageTag
        }
        
        # Deploy both applications
        Deploy-Application "deploy/k8s/api-deployment.yaml" "API Application" "meal-week-planner-api"
        Deploy-Application "deploy/k8s/web-deployment.yaml" "Web Application" "meal-week-planner-web"
        
        # Wait for deployments
        Wait-For-Deployment "meal-week-planner-api"
        Wait-For-Deployment "meal-week-planner-web"
        
        Write-ColorOutput "Forcing service worker update check..." $BLUE
        Start-Sleep -Seconds 5  # Wait for pods to be fully ready
        try {
            # Trigger service worker update check via the Angular service worker API
            Invoke-WebRequest -Uri "http://localhost/ngsw/state" -UseBasicParsing | Out-Null
            Write-ColorOutput "Service worker update check triggered" $GREEN
        } catch {
            Write-ColorOutput "WARNING: Could not trigger service worker update check" $YELLOW
        }
        
        Show-Status
        
        Write-ColorOutput "`nDeployment completed successfully!" $GREEN
        Write-ColorOutput "Access your application at: http://localhost:$WEB_PORT" $GREEN
        Write-ColorOutput "API endpoint: http://localhost:$API_PORT" $GREEN
    }
}

Write-ColorOutput "`nScript completed!" $BLUE