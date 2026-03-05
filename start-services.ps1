#!/usr/bin/env pwsh

# Auralux X - Service Manager for Windows
# Usage: ./start-services.ps1 -service api-gateway -port 3100

param(
    [string]$service = "api-gateway",
    [int]$port = 3100
)

$projectRoot = Get-Location
$servicePath = Join-Path $projectRoot "services" $service "dist" "server.js"

if (-not (Test-Path $servicePath)) {
    Write-Host "❌ Service not found: $service" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available services:" -ForegroundColor Yellow
    Get-ChildItem (Join-Path $projectRoot "services") -Directory | ForEach-Object {
        Write-Host "  - $($_.Name)"
    }
    exit 1
}

# Check if the service is already running on this port
$existingProcess = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "⚠️  Port $port is already in use" -ForegroundColor Yellow
    Write-Host "To kill the existing process, run: Stop-Process -Id $($existingProcess.OwningProcess) -Force"
    exit 1
}

Write-Host "🚀 Starting $service on port $port..." -ForegroundColor Green
Write-Host "📝 Service path: $servicePath" -ForegroundColor Cyan

$env:PORT = $port
& node $servicePath

<#
.SYNOPSIS
Starts an Auralux X microservice

.EXAMPLE
./start-services.ps1 -service api-gateway -port 3100

.EXAMPLE
./start-services.ps1 -service auth-service -port 3001

.NOTES
All services are built in dist/ directories and can be started with Node.js.
#>
