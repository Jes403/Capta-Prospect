@echo off
title CAPTA PROSPECT
color 0A

echo.
echo  ================================================
echo    CAPTA PROSPECT - SISTEMA DE PROSPECCAO B2B
echo  ================================================
echo.

:: Verifica se o Node.js esta instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERRO] Node.js nao encontrado!
    echo.
    echo  Instale o Node.js em: https://nodejs.org
    echo  Baixe a versao LTS e instale normalmente.
    echo.
    pause
    exit /b
)

:: Verifica se as dependencias estao instaladas
if not exist "node_modules" (
    echo  [!] Instalando dependencias pela primeira vez...
    echo      Isso pode demorar alguns minutos. Nao feche esta janela!
    echo.
    npm install
    echo.
)

:: Verifica se o .env existe
if not exist ".env" (
    color 0C
    echo  [ERRO] Arquivo .env nao encontrado!
    echo.
    echo  Copie o arquivo .env que foi fornecido junto com o sistema
    echo  e coloque na mesma pasta que este arquivo .bat
    echo.
    pause
    exit /b
)

:: Avisa se o banco da Receita Federal nao estiver presente
if not exist "data\receita_federal.db" (
    color 0E
    echo  [AVISO] Banco da Receita Federal nao encontrado!
    echo.
    echo  O sistema vai funcionar normalmente, MAS a funcionalidade
    echo  de Extracao (Receita Federal) estara desativada.
    echo.
    echo  Para ativar: copie o arquivo "receita_federal.db"
    echo  para a pasta "data\" dentro desta pasta.
    echo.
    color 0A
    echo  Iniciando sem o banco da Receita...
    echo.
    timeout /t 4 /nobreak >nul
)

echo  [OK] Tudo pronto! Iniciando...
echo.

:: Abre o backend (que ja serve o frontend tambem)
start "CAPTA PROSPECT - Servidor" cmd /k "title CAPTA PROSPECT - Servidor && color 0A && node server/index.js"

:: Aguarda o servidor subir
timeout /t 4 /nobreak >nul

:: Abre o navegador automaticamente
echo  Abrindo o sistema no navegador...
start http://localhost:3007

echo.
echo  ================================================
echo   Sistema iniciado!
echo.
echo   Acesse: http://localhost:3007
echo.
echo   IMPORTANTE: Para escanear o QR do WhatsApp,
echo   olhe a janela "CAPTA PROSPECT - Servidor"
echo  ================================================
echo.
pause
