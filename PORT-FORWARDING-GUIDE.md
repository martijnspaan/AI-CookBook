# Port Forwarding Guide for Meal Week Planner

## Standard Port Configuration

**ALWAYS USE THESE PORTS:**

- **Web Application**: `http://localhost:8080`
- **API Service**: `http://localhost:8081`

## How to Start Port Forwarding

**Use the official script:**
```powershell
.\start-port-forwards.ps1
```

This script will:
- Clean up any existing port forwards
- Start web app on port 8080
- Start API on port 8081
- Test both connections

## Manual Port Forwarding (if needed)

If you need to run port forwards manually:

```powershell
# Web Application
kubectl port-forward service/meal-week-planner-web-service 8080:4200

# API Service  
kubectl port-forward service/meal-week-planner-api-service 8081:4201
```

## Troubleshooting

If you see port conflicts or old images:
1. Kill all kubectl processes: `Get-Process | Where-Object {$_.ProcessName -like "*kubectl*"} | Stop-Process -Force`
2. Run the port forwarding script: `.\start-port-forwards.ps1`

## Important Notes

- **DO NOT** use port 4200 directly - always use 8080
- The script handles pod updates automatically
- If you see old content, clear browser cache or use incognito mode
