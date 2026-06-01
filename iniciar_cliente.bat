@echo off
title CAPTA PROSPECT - Iniciando...
color 0A
cls

echo.
echo  =====================================================
echo    CAPTA PROSPECT  -  Sistema de Prospeccao B2B
echo  =====================================================
echo.

:: ── 1. Node.js ────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERRO] Node.js nao esta instalado!
    echo.
    echo  Acesse: https://nodejs.org  ^|  Baixe a versao LTS
    echo  Instale normalmente e execute este arquivo novamente.
    echo.
    pause
    exit /b
)
echo  [OK] Node.js encontrado.

:: ── 2. Dependencias (so na primeira vez) ──────────────
if not exist "node_modules" (
    echo.
    echo  [!] Primeira execucao detectada.
    echo      Instalando dependencias, aguarde...
    echo.
    npm install --silent
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo  [ERRO] Falha ao instalar dependencias.
        echo  Verifique sua conexao com a internet e tente novamente.
        echo.
        pause
        exit /b
    )
    echo  [OK] Dependencias instaladas com sucesso.
    echo.
)

:: ── 3. Avisa se banco da Receita Federal nao estiver ──
if not exist "data\receita_federal.db" (
    color 0E
    echo  [AVISO] Banco da Receita Federal nao encontrado.
    echo.
    echo  Extracao de empresas estara desativada.
    echo  Para ativar: coloque "receita_federal.db" na pasta "data\".
    echo.
    color 0A
    timeout /t 3 /nobreak >nul
) else (
    echo  [OK] Banco da Receita Federal encontrado.
)

:: ── 4. Encerra instancia anterior se existir ──────────
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3007 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: ── 5. Inicia o servidor ───────────────────────────────
echo.
echo  Iniciando servidor...
start "CAPTA PROSPECT - Servidor" cmd /k "color 0A && title CAPTA PROSPECT - Servidor && node server/index.js"

:: ── 6. Aguarda o servidor responder ───────────────────
echo  Aguardando sistema ficar pronto...
:aguarda
timeout /t 2 /nobreak >nul
curl -s http://localhost:3007/api/health >nul 2>&1
if %errorlevel% neq 0 goto aguarda

:: ── 7. Abre o navegador ────────────────────────────────
start http://localhost:3007

echo.
echo  =====================================================
echo   Sistema pronto em: http://localhost:3007
echo.
echo   QR do WhatsApp: veja a janela "CAPTA PROSPECT - Servidor"
echo   Diagnostico:    http://localhost:3007/status
echo.
echo   Nao feche a janela do servidor!
echo  =====================================================
echo.
timeout /t 5 /nobreak >nul
exit
