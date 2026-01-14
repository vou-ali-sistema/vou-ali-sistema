Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Copiar Node.js para Pasta do Projeto" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se já existe Node.js local
if (Test-Path "nodejs\node.exe") {
    Write-Host "Node.js já está na pasta do projeto!" -ForegroundColor Yellow
    Write-Host "Local: $PWD\nodejs\" -ForegroundColor Yellow
    Write-Host ""
    $resposta = Read-Host "Deseja sobrescrever? (S/N)"
    if ($resposta -ne "S" -and $resposta -ne "s") {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit 0
    }
    Write-Host ""
}

Write-Host "Procurando Node.js instalado no sistema..." -ForegroundColor Cyan
Write-Host ""

$NODE_SOURCE = $null
$NPM_SOURCE = $null

# Procurar em locais comuns
$locais = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs"
)

foreach ($local in $locais) {
    $nodeExe = Join-Path $local "node.exe"
    $npmCmd = Join-Path $local "npm.cmd"
    
    if (Test-Path $nodeExe) {
        if (Test-Path $npmCmd) {
            $NODE_SOURCE = $local
            $NPM_SOURCE = $npmCmd
            Write-Host "[OK] Node.js encontrado em: $local" -ForegroundColor Green
            break
        }
    }
}

if ($null -eq $NODE_SOURCE) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ERRO: Node.js não encontrado!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Não foi possível encontrar uma instalação completa do Node.js" -ForegroundColor Yellow
    Write-Host "(com node.exe E npm.cmd) no sistema." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SOLUÇÃO:" -ForegroundColor Cyan
    Write-Host "1. Instale o Node.js de: https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Escolha a versão LTS (Long Term Support)" -ForegroundColor White
    Write-Host "3. Durante a instalação, marque 'Add to PATH'" -ForegroundColor White
    Write-Host "4. Após instalar, execute este script novamente" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Copiando Node.js para pasta do projeto" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Origem: $NODE_SOURCE" -ForegroundColor White
Write-Host "Destino: $PWD\nodejs\" -ForegroundColor White
Write-Host ""
Write-Host "Isso pode demorar alguns minutos..." -ForegroundColor Yellow
Write-Host ""

# Criar pasta nodejs se não existir
if (-not (Test-Path "nodejs")) {
    New-Item -ItemType Directory -Path "nodejs" | Out-Null
}

# Copiar arquivos
Write-Host "Copiando arquivos principais..." -ForegroundColor Cyan
try {
    Copy-Item -Path "$NODE_SOURCE\*" -Destination "nodejs\" -Recurse -Force -ErrorAction Stop
} catch {
    Write-Host ""
    Write-Host "ERRO: Falha ao copiar arquivos!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tente executar como Administrador ou copie manualmente." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se copiou corretamente
if (-not (Test-Path "nodejs\node.exe")) {
    Write-Host ""
    Write-Host "ERRO: node.exe não foi copiado corretamente!" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

if (-not (Test-Path "nodejs\npm.cmd")) {
    Write-Host ""
    Write-Host "AVISO: npm.cmd não foi encontrado após cópia." -ForegroundColor Yellow
    Write-Host "Verificando se npm está em node_modules..." -ForegroundColor Yellow
    if (-not (Test-Path "nodejs\node_modules\npm\bin\npm-cli.js")) {
        Write-Host "ERRO: npm não foi copiado corretamente!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Node.js foi copiado para a pasta do projeto!" -ForegroundColor Green
Write-Host "Local: $PWD\nodejs\" -ForegroundColor White
Write-Host ""
Write-Host "Agora você pode executar: .\start.bat" -ForegroundColor Cyan
Write-Host "O sistema usará o Node.js local automaticamente." -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione Enter para sair"

