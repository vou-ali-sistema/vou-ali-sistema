@echo off
REM Forcar janela a permanecer aberta
setlocal enabledelayedexpansion

REM Mudar para diretorio do script
cd /d "%~dp0"

REM Definir titulo da janela
title Bloco Vou Ali - Sistema

REM Mostrar mensagem inicial IMEDIATAMENTE
echo.
echo ========================================
echo   BLOCO VOU ALI - SISTEMA DE VENDAS
echo ========================================
echo.
echo Iniciando...
echo.
echo Pasta: %CD%
echo.

REM Verificar Node.js
echo Verificando Node.js...
set NODE_CMD=
set NPM_CMD=

REM Procurar Node.js local
if exist "nodejs\node.exe" (
    if exist "nodejs\npm.cmd" (
        set "NODE_CMD=%~dp0nodejs\node.exe"
        set "NPM_CMD=%~dp0nodejs\npm.cmd"
        echo [OK] Node.js local encontrado
        goto :tem_node
    )
)

REM Procurar no PATH
where node >nul 2>&1
where npm >nul 2>&1
if not errorlevel 1 (
    set "NODE_CMD=node"
    set "NPM_CMD=npm"
    echo [OK] Node.js encontrado no PATH
    goto :tem_node
)

REM Procurar em Program Files
if exist "C:\Program Files\nodejs\node.exe" (
    if exist "C:\Program Files\nodejs\npm.cmd" (
        set "NODE_CMD=C:\Program Files\nodejs\node.exe"
        set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
        echo [OK] Node.js encontrado
        goto :tem_node
    )
)

REM Nao encontrou
echo.
echo [ERRO] Node.js nao encontrado!
echo.
echo Execute: copiar-nodejs-local.bat
echo.
pause
exit /b 1

:tem_node
echo.

REM Verificar .env
if not exist ".env" (
    echo [AVISO] Arquivo .env nao encontrado!
    echo.
    set /p resp="Criar .env agora? (S/N): "
    if /i "!resp!"=="S" (
        call criar-env.bat
    ) else (
        echo Execute criar-env.bat manualmente
        pause
        exit /b 1
    )
    echo.
)

REM Instalar dependencias
if not exist "node_modules" (
    echo Instalando dependencias...
    call %NPM_CMD% install
    if errorlevel 1 (
        echo ERRO ao instalar
        pause
        exit /b 1
    )
    echo.
)

REM Verificar se ha processos Node.js rodando
echo Verificando processos Node.js...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [AVISO] Processos Node.js encontrados. Encerrando...
    taskkill /F /IM node.exe >NUL 2>&1
    timeout /t 2 /nobreak >NUL
)

REM Gerar Prisma
echo Gerando Prisma Client...
call %NPM_CMD% exec prisma generate
if errorlevel 1 (
    echo ERRO ao gerar Prisma
    echo Tentando limpar cache e gerar novamente...
    if exist "node_modules\.prisma" (
        rmdir /S /Q "node_modules\.prisma" 2>NUL
    )
    call %NPM_CMD% exec prisma generate
    if errorlevel 1 (
        echo ERRO ao gerar Prisma apos limpeza
        pause
        exit /b 1
    )
)
echo.

REM Aplicar schema
echo Aplicando schema do banco...
call %NPM_CMD% exec prisma db push
if errorlevel 1 (
    echo ERRO ao aplicar schema
    pause
    exit /b 1
)
echo.

REM Seed
echo Executando seed...
call %NPM_CMD% run db:seed
echo.

REM Iniciar servidor
echo ========================================
echo   SERVIDOR INICIANDO
echo   Acesse: http://localhost:3000
echo ========================================
echo.
echo Pressione Ctrl+C para parar
echo.

call %NPM_CMD% run dev

echo.
echo Servidor encerrado.
pause
