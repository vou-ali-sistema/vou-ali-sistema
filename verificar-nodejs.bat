@echo off
echo ========================================
echo   Verificando Node.js e npm
echo ========================================
echo.

echo Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    set NODE_OK=0
    echo [X] Node.js NAO encontrado
    echo.
) else (
    set NODE_OK=1
    for /f "delims=" %%i in ('where node') do set NODE_PATH=%%i
    echo [OK] Node.js encontrado em: %NODE_PATH%
    node --version
    echo.
)

echo Verificando npm...
where npm >nul 2>&1
if errorlevel 1 (
    set NPM_OK=0
    echo [X] npm NAO encontrado
    echo.
) else (
    set NPM_OK=1
    for /f "delims=" %%i in ('where npm') do set NPM_PATH=%%i
    echo [OK] npm encontrado em: %NPM_PATH%
    npm --version
    echo.
)

echo ========================================
echo   Status
echo ========================================
echo.

if %NODE_OK%==0 (
    echo STATUS: Node.js precisa ser instalado
    echo.
    echo SOLUCAO:
    echo 1. Instale o Node.js de: https://nodejs.org/
    echo 2. Escolha a versao LTS (Long Term Support)
    echo 3. Durante a instalacao, marque "Add to PATH"
    echo 4. Depois de instalar, feche e abra um NOVO terminal
    echo 5. Execute este script novamente
    echo.
    echo Veja o arquivo: INSTALAR_NODEJS.md para mais detalhes
) else (
    if %NPM_OK%==0 (
        echo STATUS: npm nao encontrado (reinstale Node.js)
    ) else (
        echo STATUS: Tudo OK! Node.js e npm estao instalados.
        echo.
        echo Voce pode executar: start.bat
    )
)

echo.
pause
