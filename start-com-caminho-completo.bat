@echo off
echo ========================================
echo   Bloco Vou Ali - Sistema de Vendas
echo ========================================
echo.

echo [1/5] Procurando Node.js...
set NODE_CMD=
set NPM_CMD=

REM PRIORIDADE 1: Verificar se Node.js esta na pasta do projeto (local)
if exist "nodejs\node.exe" (
    set NODE_CMD="%~dp0nodejs\node.exe"
    if exist "nodejs\npm.cmd" (
        set NPM_CMD="%~dp0nodejs\npm.cmd"
    ) else if exist "nodejs\node_modules\npm\bin\npm-cli.js" (
        set NPM_CMD="%~dp0nodejs\node.exe" "%~dp0nodejs\node_modules\npm\bin\npm-cli.js"
    )
    echo [OK] Node.js encontrado na pasta do projeto (local)
    goto :found
)

REM PRIORIDADE 2: Verificar se esta no PATH
where node >nul 2>&1
if not errorlevel 1 (
    where npm >nul 2>&1
    if not errorlevel 1 (
        set NODE_CMD=node
        set NPM_CMD=npm
        echo [OK] Node.js encontrado no PATH
        goto :found
    )
)

REM Procurar em locais comuns
if exist "C:\Program Files\nodejs\node.exe" (
    set NODE_CMD="C:\Program Files\nodejs\node.exe"
    set NPM_CMD="C:\Program Files\nodejs\npm.cmd"
    echo [OK] Node.js encontrado em: C:\Program Files\nodejs\
    goto :found
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set NODE_CMD="C:\Program Files (x86)\nodejs\node.exe"
    set NPM_CMD="C:\Program Files (x86)\nodejs\npm.cmd"
    echo [OK] Node.js encontrado em: C:\Program Files (x86)\nodejs\
    goto :found
)

if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set NODE_CMD="%LOCALAPPDATA%\Programs\nodejs\node.exe"
    set NPM_CMD="%LOCALAPPDATA%\Programs\nodejs\npm.cmd"
    echo [OK] Node.js encontrado em: %LOCALAPPDATA%\Programs\nodejs\
    goto :found
)

echo.
echo ========================================
echo   ERRO: Node.js nao encontrado!
echo ========================================
echo.
echo Node.js nao esta instalado ou nao foi encontrado.
echo.
echo SOLUCAO:
echo 1. Instale o Node.js de: https://nodejs.org/
echo 2. Escolha a versao LTS
echo 3. Durante a instalacao, marque "Add to PATH"
echo 4. REINICIE o computador
echo 5. Execute este script novamente
echo.
echo Ou execute: diagnostico-nodejs.bat para mais informacoes
echo.
pause
exit /b 1

:found
echo.
echo [2/5] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias (pode demorar alguns minutos)...
    call %NPM_CMD% install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias
        pause
        exit /b 1
    )
) else (
    echo Dependencias ja instaladas.
)
echo.

echo [3/5] Gerando Prisma Client...
call %NPM_CMD% run db:push
if errorlevel 1 (
    echo ERRO: Falha ao gerar Prisma Client ou aplicar schema
    pause
    exit /b 1
)
echo.

echo [4/5] Executando seed (criar admin e lote)...
call %NPM_CMD% run db:seed
if errorlevel 1 (
    echo AVISO: Seed pode ter falhado, mas continuando...
)
echo.

echo [5/5] Iniciando servidor de desenvolvimento...
echo.
echo ========================================
echo   Iniciando servidor
echo   Acesse: http://localhost:3000
echo ========================================
echo.

call %NPM_CMD% run dev

pause

