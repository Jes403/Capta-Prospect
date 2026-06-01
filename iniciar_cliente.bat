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
    echo  Acesse: https://nodejs.org
    echo  Baixe a versao LTS e instale.
    echo  Depois execute este arquivo novamente.
    echo.
    pause
    exit /b
)
echo  [OK] Node.js encontrado.

:: ── 2. Dependencias ───────────────────────────────────
if not exist "node_modules" (
    echo.
    echo  [!] Primeira execucao: instalando dependencias...
    echo      Aguarde, isso leva alguns minutos.
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
    echo  [OK] Dependencias instaladas.
)

:: ── 3. Arquivo .env ────────────────────────────────────
if not exist ".env" (
    color 0C
    echo.
    echo  [ERRO] Arquivo .env nao encontrado!
    echo.
    echo  Renomeie o arquivo ".env.example" para ".env"
    echo  e preencha com suas chaves de API.
    echo.
    pause
    exit /b
)
echo  [OK] Configuracoes encontradas.

:: ── 4. Banco de dados ──────────────────────────────────
if not exist "data\receita_federal.db" (
    echo.
    color 0E
    echo  [AVISO] Banco da Receita Federal nao encontrado.
    echo.
    echo  A extracao de empresas estara desativada.
    echo  Para ativar: copie "receita_federal.db" para a pasta "data\".
    echo.
    color 0A
    timeout /t 3 /nobreak >nul
) else (
    echo  [OK] Banco da Receita Federal encontrado.
)

:: ── 5. Encerra processo antigo se ainda estiver rodando
echo.
echo  Verificando porta 3007...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3007 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: ── 6. Inicia o servidor ───────────────────────────────
echo  Iniciando servidor...
echo.
start "CAPTA PROSPECT" cmd /k "color 0A && title CAPTA PROSPECT - Servidor && echo. && echo  Servidor iniciando, aguarde... && echo. && node server/index.js"

:: ── 7. Aguarda e abre o navegador ─────────────────────
echo  Aguardando servidor ficar pronto...
timeout /t 5 /nobreak >nul

:aguarda
curl -s http://localhost:3007/api/health >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto aguarda
)

echo  [OK] Servidor pronto!
echo.
echo  Abrindo no navegador...
start http://localhost:3007

echo.
echo  =====================================================
echo   Sistema iniciado em: http://localhost:3007
echo.
echo   Para o QR do WhatsApp, veja a outra janela.
echo   Nao feche a janela "CAPTA PROSPECT - Servidor"!
echo  =====================================================
echo.
timeout /t 5 /nobreak >nul
exit
