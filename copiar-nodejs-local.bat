@echo off
echo ========================================
echo   Copiar Node.js para Pasta do Projeto
echo ========================================
echo.

REM Verificar se ja existe Node.js local
if exist "nodejs\node.exe" (
    echo.
    echo Node.js ja esta na pasta do projeto!
    echo Local: %~dp0nodejs\
    echo.
    echo Deseja sobrescrever? (S/N)
    set /p resposta=
    if /i not "%resposta%"=="S" (
        echo Operacao cancelada.
        pause
        exit /b 0
    )
    echo.
)

echo Procurando Node.js instalado no sistema...
echo.

set NODE_SOURCE=
set NPM_SOURCE=

REM Procurar em locais comuns
if exist "C:\Program Files\nodejs\node.exe" (
    if exist "C:\Program Files\nodejs\npm.cmd" (
        set NODE_SOURCE=C:\Program Files\nodejs
        set NPM_SOURCE=C:\Program Files\nodejs\npm.cmd
        echo [OK] Node.js encontrado em: C:\Program Files\nodejs\
        goto :found_source
    )
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    if exist "C:\Program Files (x86)\nodejs\npm.cmd" (
        set NODE_SOURCE=C:\Program Files (x86)\nodejs
        set NPM_SOURCE=C:\Program Files (x86)\nodejs\npm.cmd
        echo [OK] Node.js encontrado em: C:\Program Files (x86)\nodejs\
        goto :found_source
    )
)

if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    if exist "%LOCALAPPDATA%\Programs\nodejs\npm.cmd" (
        set NODE_SOURCE=%LOCALAPPDATA%\Programs\nodejs
        set NPM_SOURCE=%LOCALAPPDATA%\Programs\nodejs\npm.cmd
        echo [OK] Node.js encontrado em: %LOCALAPPDATA%\Programs\nodejs\
        goto :found_source
    )
)

echo.
echo ========================================
echo   ERRO: Node.js completo nao encontrado!
echo ========================================
echo.
echo Nao foi possivel encontrar uma instalacao COMPLETA do Node.js
echo (com node.exe E npm.cmd) no sistema.
echo.
echo O Node.js pode estar instalado, mas sem o npm (gerenciador de pacotes).
echo Isso indica uma instalacao incompleta ou corrompida.
echo.
echo SOLUCAO:
echo.
echo 1. Desinstale o Node.js atual (se houver)
echo    - Painel de Controle ^> Programas ^> Desinstalar
echo.
echo 2. Baixe e instale o Node.js COMPLETO de: https://nodejs.org/
echo    - Escolha a versao LTS (Long Term Support)
echo    - Durante a instalacao, marque "Add to PATH"
echo    - Certifique-se de que a instalacao inclui o npm
echo.
echo 3. Apos instalar, REINICIE o computador
echo    (ou feche e abra um novo terminal)
echo.
echo 4. Execute este script novamente: copiar-nodejs-local.bat
echo.
echo IMPORTANTE: A instalacao padrao do Node.js inclui o npm automaticamente.
echo Se o npm nao esta presente, a instalacao esta incompleta.
echo.
pause
exit /b 1

:found_source
echo.
echo ========================================
echo   Copiando Node.js para pasta do projeto
echo ========================================
echo.
echo Origem: %NODE_SOURCE%
echo Destino: %~dp0nodejs\
echo.
echo Isso pode demorar alguns minutos...
echo.

REM Criar pasta nodejs se nao existir
if not exist "nodejs" mkdir nodejs

REM Copiar arquivos essenciais
echo Copiando arquivos principais...
xcopy "%NODE_SOURCE%\*.*" "nodejs\" /E /I /Y /Q >nul 2>&1

if errorlevel 1 (
    echo.
    echo ERRO: Falha ao copiar arquivos!
    echo.
    echo Tente executar como Administrador ou copie manualmente.
    echo.
    pause
    exit /b 1
)

REM Verificar se copiou corretamente
if not exist "nodejs\node.exe" (
    echo.
    echo ERRO: node.exe nao foi copiado corretamente!
    echo.
    pause
    exit /b 1
)

if not exist "nodejs\npm.cmd" (
    echo.
    echo AVISO: npm.cmd nao foi encontrado apos copia.
    echo Verificando se npm esta em node_modules...
    if not exist "nodejs\node_modules\npm\bin\npm-cli.js" (
        echo ERRO: npm nao foi copiado corretamente!
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   SUCESSO!
echo ========================================
echo.
echo Node.js foi copiado para a pasta do projeto!
echo Local: %~dp0nodejs\
echo.
echo Agora voce pode executar: start.bat
echo O sistema usara o Node.js local automaticamente.
echo.
pause

