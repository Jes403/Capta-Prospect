@echo off
title CAPTA PROSPECT - Iniciando Sistema...
color 0A

echo.
echo  ================================================
echo    CAPTA PROSPECT - SISTEMA DE PROSPECCAO B2B
echo  ================================================
echo.
echo  Iniciando os 3 servicos do sistema...
echo  Aguarde todos ficarem prontos antes de usar!
echo.
echo  [1] Convex (Banco de Dados em Tempo Real)
echo  [2] Backend (Motor de Mineracao - Porta 3006)
echo  [3] Frontend (Interface - http://localhost:5173)
echo.

:: Abre Terminal 1 - Convex
start "CONVEX - Banco de Dados" cmd /k "title [1] CONVEX - Banco de Dados && color 0B && echo AGUARDE: Iniciando banco de dados... && npx convex dev"

:: Espera 3 segundos para o Convex inicializar primeiro
timeout /t 3 /nobreak >nul

:: Abre Terminal 2 - Backend
start "BACKEND - Motor de Mineracao" cmd /k "title [2] BACKEND - Motor de Mineracao && color 0E && echo AGUARDE: Iniciando servidor backend... && npm run server"

:: Espera 2 segundos
timeout /t 2 /nobreak >nul

:: Abre Terminal 3 - Frontend
start "FRONTEND - Interface Web" cmd /k "title [3] FRONTEND - Interface Web && color 0A && echo AGUARDE: Iniciando interface... && npm run dev"

echo.
echo  ================================================
echo   Os 3 terminais foram abertos!
echo.  
echo   Aguarde aparecer:
echo   [1] Convex functions ready!
echo   [2] Backend Master rodando na porta 3006
echo   [3] Local: http://localhost:5173
echo.
echo   Depois acesse: http://localhost:5173
echo  ================================================
echo.
pause
