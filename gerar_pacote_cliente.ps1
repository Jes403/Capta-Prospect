# gerar_pacote_cliente.ps1
# Gera a pasta "capta-prospect-cliente" pronta para entrega
# Execute com: powershell -ExecutionPolicy Bypass -File gerar_pacote_cliente.ps1

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CAPTA PROSPECT - Gerando Pacote de Entrega"    -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$origem = $PSScriptRoot
$destino = Join-Path $origem "capta-prospect-cliente"

# Remove pacote anterior se existir
if (Test-Path $destino) {
    Write-Host "[1/5] Limpando pacote anterior..." -ForegroundColor Yellow
    Remove-Item $destino -Recurse -Force
}

# Compila o frontend
Write-Host "[1/5] Compilando frontend..." -ForegroundColor Yellow
Set-Location $origem
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha no build do frontend. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host "[2/5] Criando pasta de entrega..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $destino | Out-Null

# Arquivos e pastas a copiar
$itens = @(
    "server",
    "dist",
    "scripts",
    "package.json",
    "package-lock.json",
    ".env.example",
    "iniciar_cliente.bat"
)

Write-Host "[3/5] Copiando arquivos..." -ForegroundColor Yellow
foreach ($item in $itens) {
    $src = Join-Path $origem $item
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $destino $item) -Recurse -Force
        Write-Host "   copiado: $item" -ForegroundColor Gray
    }
}

# Cria o .env do cliente a partir do .env local ou do .env.example
Write-Host "[4/5] Gerando .env do cliente..." -ForegroundColor Yellow
$envDestino = Join-Path $destino ".env"
$envLocal   = Join-Path $origem ".env"
$envExample = Join-Path $origem ".env.example"
if (Test-Path $envLocal) {
    Copy-Item $envLocal $envDestino -Force
    Write-Host "   .env copiado do arquivo local." -ForegroundColor Gray
} elseif (Test-Path $envExample) {
    Copy-Item $envExample $envDestino -Force
    Write-Host "   .env gerado a partir do .env.example (chaves ja preenchidas)." -ForegroundColor Gray
} else {
    Write-Host "   AVISO: nenhum .env encontrado. Cliente precisara configurar manualmente." -ForegroundColor Red
}

Write-Host "[5/5] Gerando instrucoes de instalacao..." -ForegroundColor Yellow
$instrucoes = @"
==============================================
  CAPTA PROSPECT - INSTRUCOES DE INSTALACAO
==============================================

PRE-REQUISITO: Node.js instalado
  Baixe em: https://nodejs.org (versao LTS)

COMO USAR:
  1. Extraia esta pasta em qualquer lugar do computador
  2. Certifique-se que o arquivo ".env" esta na pasta
  3. Clique duas vezes em "iniciar_cliente.bat"
  4. O sistema abrira automaticamente no navegador
     em: http://localhost:3007

WHATSAPP:
  - Ao iniciar, aparecera um QR Code no terminal
  - Escaneie com o WhatsApp do celular
  - A sessao fica salva: so precisa escanear uma vez

SUPORTE: Entre em contato com o desenvolvedor.
==============================================
"@
$instrucoes | Out-File (Join-Path $destino "LEIA-ME.txt") -Encoding UTF8

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Pacote gerado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "  Pasta: capta-prospect-cliente\" -ForegroundColor White
Write-Host ""
Write-Host "  ANTES DE ENTREGAR:" -ForegroundColor Yellow
Write-Host "  1. Abra o .env na pasta e revise as chaves" -ForegroundColor Yellow
Write-Host "  2. Remova chaves que o cliente nao deve ver" -ForegroundColor Yellow
Write-Host "  3. Compacte a pasta e envie" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
