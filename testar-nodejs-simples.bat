@echo off
echo ========================================
echo   Teste Simples - Node.js
echo ========================================
echo.

echo Testando se node funciona...
node --version 2>nul
if errorlevel 1 (
    echo.
    echo Node.js NAO esta funcionando no terminal atual.
    echo.
    echo TENTE ISSO:
    echo.
    echo 1. FECHE este terminal completamente
    echo 2. REINICIE o computador (recomendado)
    echo 3. OU feche TODOS os terminais e programas
    echo 4. Abra um NOVO terminal
    echo 5. Execute este script novamente
    echo.
    echo Se ainda nao funcionar, o Node.js pode nao estar instalado.
    echo Verifique se instalou corretamente de: https://nodejs.org/
    echo.
) else (
    echo.
    echo ========================================
    echo   SUCESSO!
    echo ========================================
    echo.
    echo Node.js esta funcionando!
    echo.
    echo Agora execute: start.bat
    echo.
)

echo.
pause

