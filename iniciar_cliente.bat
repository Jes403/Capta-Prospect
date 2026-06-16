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

:: ── 2. Arquivo .env ────────────────────────────────────
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  [OK] Arquivo .env criado automaticamente.
    ) else (
        color 0C
        echo  [ERRO] Arquivo .env nao encontrado. Contate o suporte.
        echo.
        pause
        exit /b
    )
) else (
    echo  [OK] Arquivo .env encontrado.
)

:: ── 3. Dependencias ────────────────────────────────────
if not exist "node_modules" (
    echo.
    echo  [!] Primeira execucao - Instalando dependencias...
    echo      Isso pode demorar alguns minutos. Aguarde.
    echo.
    npm install
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

:: ── 4. Chrome do Puppeteer (extracao Google Maps) ──────
if not exist ".puppeteer_ready" (
    echo.
    echo  [!] Instalando Chrome para extracao de leads...
    echo      Aguarde, pode demorar alguns minutos...
    echo.
    npx puppeteer browsers install chrome
    if %errorlevel% neq 0 (
        color 0E
        echo.
        echo  [AVISO] Falha ao instalar Chrome do Puppeteer.
        echo  Extracao via Google Maps pode nao funcionar.
        echo.
        color 0A
        timeout /t 3 /nobreak >nul
    ) else (
        echo 1 > .puppeteer_ready
        echo  [OK] Chrome instalado com sucesso.
        echo.
    )
)

:: ── 5. Banco da Receita Federal ────────────────────────
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

:: ── 6. Encerra instancia anterior se existir ──────────
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3007 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: ── 7. Compila o frontend se necessario ───────────────
if not exist "dist" (
    echo.
    echo  [!] Compilando o frontend, aguarde...
    echo.
    npm run build
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo  [ERRO] Falha ao compilar o frontend.
        echo.
        pause
        exit /b
    )
    echo  [OK] Frontend compilado com sucesso.
    echo.
)

:: ── 8. Inicia o servidor ───────────────────────────────
echo.
echo  Iniciando servidor...
start "CAPTA PROSPECT - Servidor" cmd /k "color 0A && title CAPTA PROSPECT - Servidor && node server/index.js"

:: ── 9. Aguarda o servidor responder ───────────────────
echo  Aguardando sistema ficar pronto...
timeout /t 8 /nobreak >nul

:: ── 10. Abre o navegador ───────────────────────────────
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
