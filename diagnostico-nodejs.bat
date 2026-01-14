@echo off
echo ========================================
echo   Diagnostico Completo - Node.js
echo ========================================
echo.

echo [1/5] Verificando Node.js no PATH...
where node >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js NAO encontrado no PATH
    set PATH_OK=0
) else (
    echo [OK] Node.js encontrado no PATH
    where node
    node --version
    set PATH_OK=1
)
echo.

echo [2/5] Procurando Node.js em locais comuns...
set NODE_FOUND=0

if exist "C:\Program Files\nodejs\node.exe" (
    echo [OK] Encontrado em: C:\Program Files\nodejs\
    set NODE_FOUND=1
    set NODE_PATH=C:\Program Files\nodejs
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    echo [OK] Encontrado em: C:\Program Files (x86)\nodejs\
    set NODE_FOUND=1
    set NODE_PATH=C:\Program Files (x86)\nodejs
)

if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    echo [OK] Encontrado em: %LOCALAPPDATA%\Programs\nodejs\
    set NODE_FOUND=1
    set NODE_PATH=%LOCALAPPDATA%\Programs\nodejs
)

if %NODE_FOUND%==0 (
    echo [X] Node.js NAO encontrado em locais comuns
    echo.
    echo DIAGNOSTICO: Node.js provavelmente nao esta instalado
    echo.
    echo SOLUCAO:
    echo 1. Instale o Node.js de: https://nodejs.org/
    echo 2. Escolha a versao LTS
    echo 3. Durante a instalacao, marque "Add to PATH"
    echo 4. REINICIE o computador ou feche TODOS os terminais
    echo 5. Abra um NOVO terminal e execute este script novamente
) else (
    if %PATH_OK%==0 (
        echo.
        echo ========================================
        echo   PROBLEMA ENCONTRADO
        echo ========================================
        echo.
        echo Node.js esta instalado mas NAO esta no PATH!
        echo.
        echo Localizacao: %NODE_PATH%
        echo.
        echo SOLUCAO RAPIDA:
        echo.
        echo Opcao 1: Reiniciar o computador
        echo   - Isso atualiza o PATH automaticamente
        echo.
        echo Opcao 2: Adicionar manualmente ao PATH
        echo   1. Pressione Win + R
        echo   2. Digite: sysdm.cpl
        echo   3. Vá em "Avançado" ^> "Variáveis de Ambiente"
        echo   4. Em "Variáveis do sistema", encontre "Path"
        echo   5. Clique em "Editar"
        echo   6. Clique em "Novo"
        echo   7. Adicione: %NODE_PATH%
        echo   8. Clique em "OK" em todas as janelas
        echo   9. FECHE e abra um NOVO terminal
        echo.
        echo Opcao 3: Usar caminho completo temporariamente
        echo   Edite o start.bat e use: "%NODE_PATH%\node.exe" e "%NODE_PATH%\npm.cmd"
        echo.
    ) else (
        echo.
        echo ========================================
        echo   TUDO OK!
        echo ========================================
        echo.
        echo Node.js esta instalado e no PATH!
        echo.
        echo Voce pode executar: start.bat
        echo.
    )
)
echo.

echo [3/5] Verificando variavel de ambiente PATH...
echo PATH atual contem:
echo %PATH% | findstr /i "nodejs" >nul
if errorlevel 1 (
    echo [X] Node.js NAO esta no PATH
) else (
    echo [OK] Node.js esta no PATH
)
echo.

echo [4/5] Testando se node funciona diretamente...
if %NODE_FOUND%==1 (
    echo Testando: "%NODE_PATH%\node.exe" --version
    "%NODE_PATH%\node.exe" --version
    if errorlevel 1 (
        echo [X] Node.js encontrado mas nao funciona
    ) else (
        echo [OK] Node.js funciona quando chamado diretamente
    )
)
echo.

echo [5/5] Resumo...
echo.
if %NODE_FOUND%==0 (
    echo STATUS: Node.js NAO esta instalado
    echo ACAO: Instale o Node.js de https://nodejs.org/
) else (
    if %PATH_OK%==0 (
        echo STATUS: Node.js instalado mas NAO no PATH
        echo ACAO: Reinicie o computador ou adicione manualmente ao PATH
    ) else (
        echo STATUS: Tudo OK! Node.js instalado e funcionando
        echo ACAO: Execute start.bat
    )
)

echo.
pause

