@echo off
:: Auralux X — No-Docker Dev Launcher
:: Starts MongoDB in-memory, all 11 microservices, and the Next.js frontend.
::
:: Usage:
::   start-dev.bat                  Start everything
::   start-dev.bat --services-only  Start only backend services
::   start-dev.bat --frontend-only  Start only the frontend

title Auralux X Dev

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   Auralux X — No-Docker Dev Launcher     ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  Starting platform... (press Ctrl+C to stop all services)
echo.

node "%~dp0dev-launcher.js" %*
