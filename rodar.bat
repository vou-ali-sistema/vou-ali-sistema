@echo off
title Bloco Vou Ali - Sistema de Vendas

REM Garantir que a janela permaneca aberta
setlocal enabledelayedexpansion

REM Mudar para o diretorio do script
cd /d "%~dp0"

REM Mostrar mensagem inicial
echo.
echo ========================================
echo   Bloco Vou Ali - Sistema de Vendas
echo ========================================
echo.
echo Diretorio: %CD%
echo.
echo Aguarde, verificando requisitos...
echo.

REM ========================================
REM   Verificar Node.js e npm
REM ========================================
set NODE_CMD=
set NPM_CMD=
set NPM_ARGS=

REM Procurar Node.js local primeiro
if exist "nodejs\node.exe" (
    set "NODE_CMD=%~dp0nodejs\node.exe"
    if exist "nodejs\npm.cmd" (
        set "NPM_CMD=%~dp0nodejs\npm.cmd"
        echo [OK] Node.js local encontrado
        goto :encontrado
    )
)

REM Procurar no PATH
where node >nul 2>&1
if not errorlevel 1 (
    where npm >nul 2>&1
    if not errorlevel 1 (
        node --version >nul 2>&1
        if not errorlevel 1 (
            npm --version >nul 2>&1
            if not errorlevel 1 (
                set "NODE_CMD=node"
                set "NPM_CMD=npm"
                echo [OK] Node.js encontrado no PATH
                goto :encontrado
            )
        )
    )
)

REM Procurar em locais comuns
if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_CMD=C:\Program Files\nodejs\node.exe"
    if exist "C:\Program Files\nodejs\npm.cmd" (
        set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
        echo [OK] Node.js encontrado
        goto :encontrado
    )
)

REM Se nao encontrou
echo.
echo ========================================
echo   ERRO: Node.js nao encontrado!
echo ========================================
echo.
echo Execute: copiar-nodejs-local.bat
echo Ou instale o Node.js de: https://nodejs.org/
echo.
pause
exit /b 1

:encontrado
echo.

REM ========================================
REM   Verificar .env
REM ========================================
if not exist ".env" (
    echo AVISO: Arquivo .env nao encontrado!
    echo.
    set /p criar="Criar arquivo .env agora? (S/N): "
    if /i "!criar!"=="S" (
        call criar-env.bat
        if errorlevel 1 (
            echo ERRO ao criar .env
            pause
            exit /b 1
        )
        echo.
        echo Configure a senha do PostgreSQL no arquivo .env!
        echo.
        pause
    ) else (
        echo Execute criar-env.bat manualmente.
        pause
        exit /b 1
    )
)
echo.

REM ========================================
REM   Instalar dependencias
REM ========================================
if not exist "node_modules" (
    echo Instalando dependencias...
    echo.
    if defined NPM_ARGS (
        call %NPM_CMD% "%NPM_ARGS%" install
    ) else (
        call %NPM_CMD% install
    )
    if errorlevel 1 (
        echo ERRO ao instalar dependencias
        pause
        exit /b 1
    )
    echo.
)

REM ========================================
REM   Gerar Prisma Client
REM ========================================
echo Gerando Prisma Client...
if defined NPM_ARGS (
    call %NPM_CMD% "%NPM_ARGS%" exec prisma generate
) else (
    call %NPM_CMD% exec prisma generate
)
if errorlevel 1 (
    echo ERRO ao gerar Prisma Client
    pause
    exit /b 1
)
echo.

REM ========================================
REM   Aplicar schema
REM ========================================
echo Aplicando schema do banco...
if defined NPM_ARGS (
    call %NPM_CMD% "%NPM_ARGS%" exec prisma db push
) else (
    call %NPM_CMD% exec prisma db push
)
if errorlevel 1 (
    echo ERRO ao aplicar schema
    pause
    exit /b 1
)
echo.

REM ========================================
REM   Executar seed
REM ========================================
echo Executando seed...
if defined NPM_ARGS (
    call %NPM_CMD% "%NPM_ARGS%" run db:seed
) else (
    call %NPM_CMD% run db:seed
)
if errorlevel 1 (
    echo AVISO: Seed pode ter falhado
)
echo.

REM ========================================
REM   Iniciar servidor
REM ========================================
echo ========================================
echo   Iniciando servidor
echo   Acesse: http://localhost:3000
echo ========================================
echo.
echo Pressione Ctrl+C para parar
echo.

if defined NPM_ARGS (
    call %NPM_CMD% "%NPM_ARGS%" run dev
) else (
    call %NPM_CMD% run dev
)

echo.
echo Servidor encerrado.
pause
exit /b 0
