@echo off
title CAPTA PROSPECT - Iniciando Sistema...
color 0A

echo.
echo  ================================================
echo    CAPTA PROSPECT - SISTEMA DE PROSPECCAO B2B
echo  ================================================
echo.
echo  Iniciando os servicos do sistema...
echo  Aguarde todos ficarem prontos antes de usar!
echo.
echo  [1] Convex Dev (sincroniza funcoes com a nuvem)
echo  [2] Backend + Frontend (Porta 3007)
echo.

:: Abre Terminal 1 - Convex Dev (sincroniza schema/funcoes)
start "CONVEX - Sincronizacao" cmd /k "title [1] CONVEX - Sincronizacao && color 0B && echo Sincronizando funcoes com o Convex... && npx convex dev"

:: Espera o Convex inicializar
timeout /t 5 /nobreak >nul

:: Abre Terminal 2 - Backend (serve tambem o frontend compilado)
start "CAPTA PROSPECT - Servidor" cmd /k "title [2] BACKEND + FRONTEND && color 0E && echo Iniciando servidor backend... && node server/index.js"

:: Espera o servidor subir
timeout /t 3 /nobreak >nul

echo.
echo  ================================================
echo   Os terminais foram abertos!
echo.
echo   Aguarde aparecer:
echo   [1] "1 function ready" (Convex)
echo   [2] "Backend Master rodando na porta 3007"
echo.
echo   Depois acesse: http://localhost:3007
echo.
echo   Para o QR do WhatsApp, olhe o terminal [2]
echo  ================================================
echo.
pause
