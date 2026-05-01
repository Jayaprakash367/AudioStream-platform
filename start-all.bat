@echo off
REM Complete Application Startup Script for Windows
REM Starts frontend, backend services, and displays status

title Auralux X - Application Startup

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     Auralux X - Complete Application Startup                  ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% found
echo.

REM Create logs directory
if not exist logs mkdir logs

echo Starting services...
echo.

echo → Starting Frontend (port 3000)...
start "Auralux Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak

echo → Starting API Gateway (port 3100)...
start "Auralux API Gateway" cmd /k "cd services\api-gateway && npm run dev"
timeout /t 2 /nobreak

echo → Starting Auth Service (port 3001)...
start "Auralux Auth Service" cmd /k "cd services\auth-service && npm run dev"

echo → Starting User Service (port 3002)...
start "Auralux User Service" cmd /k "cd services\user-service && npm run dev"

echo → Starting Music Service (port 3003)...
start "Auralux Music Service" cmd /k "cd services\music-service && npm run dev"

echo → Starting Streaming Service (port 3004)...
start "Auralux Streaming Service" cmd /k "cd services\streaming-service && npm run dev"

timeout /t 2 /nobreak

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                     Services Started                            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo ✓ Frontend:           http://localhost:3000
echo ✓ API Gateway:        http://localhost:3100
echo ✓ Auth Service:       http://localhost:3001
echo ✓ User Service:       http://localhost:3002
echo ✓ Music Service:      http://localhost:3003
echo ✓ Streaming Service:  http://localhost:3004
echo.
echo 📋 Services are running in separate windows.
echo    Close individual windows to stop specific services.
echo    Close all windows to stop all services.
echo.
pause
