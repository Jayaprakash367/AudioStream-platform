@echo off
REM Auralux X - Service Manager for Windows (Batch version)
REM Usage: start-service.bat api-gateway 3100

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: start-service.bat ^<service-name^> [port]
    echo.
    echo Available services:
    cd services
    for /d %%D in (*) do echo   - %%D
    cd ..
    exit /b 1
)

set SERVICE=%~1
set PORT=%~2
if "%PORT%"=="" set PORT=3100

set "SERVICE_PATH=.\services\%SERVICE%\dist\server.js"

if not exist "%SERVICE_PATH%" (
    echo Error: Service not found at %SERVICE_PATH%
    exit /b 1
)

echo Auralux X - Starting %SERVICE% on port %PORT%
echo.

set PORT=%PORT%
node "%SERVICE_PATH%"

endlocal
