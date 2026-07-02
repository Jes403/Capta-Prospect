@echo off
title CAPTA PROSPECT - Iniciando Sistema...
color 0A

cd /d "%~dp0"

echo.
echo  ================================================
echo    CAPTA PROSPECT - SISTEMA DE PROSPECCAO B2B
echo  ================================================
echo.

:: Terminal 1 - Convex
echo [1/3] Iniciando Convex...
start "Capta - Convex" cmd /k "title [1] CONVEX && color 0B && npx convex dev"
timeout /t 5 /nobreak >nul

:: Terminal 2 - Backend
echo [2/3] Iniciando Backend...
start "Capta - Backend" cmd /k "title [2] BACKEND (3007) && color 0E && node server/index.js"
timeout /t 3 /nobreak >nul

:: Terminal 3 - Frontend Vite (hot-reload)
echo [3/3] Iniciando Frontend...
start "Capta - Frontend" cmd /k "title [3] FRONTEND (3005) && color 0A && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo  ================================================
echo   Aguarde todos ficarem prontos:
echo   [1] Convex   - "1 function ready"
echo   [2] Backend  - http://localhost:3007
echo   [3] Frontend - http://localhost:3005
echo  ================================================
echo.
start http://localhost:3005
pause
