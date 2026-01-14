@echo off
echo ========================================
echo   Testar Senha do PostgreSQL
echo ========================================
echo.
echo Este script vai testar se a senha esta correta.
echo.

set /p SENHA_TESTE="Digite a senha do PostgreSQL para testar: "

echo.
echo Testando conexao...
echo.

set PGPASSWORD=%SENHA_TESTE%
psql -U postgres -h localhost -d postgres -c "SELECT version();" >nul 2>&1

if errorlevel 1 (
    echo.
    echo ========================================
    echo   SENHA INCORRETA
    echo ========================================
    echo.
    echo A senha que voce digitou nao esta correta.
    echo.
    echo Opcoes:
    echo 1. Tente outra senha
    echo 2. Execute: redefinir-senha-postgres.bat
    echo 3. Verifique o arquivo COMO_DESCOBRIR_SENHA_POSTGRESQL.md
    echo.
) else (
    echo.
    echo ========================================
    echo   SENHA CORRETA!
    echo ========================================
    echo.
    echo A senha esta funcionando!
    echo.
    echo Agora atualize o arquivo .env:
    echo DATABASE_URL="postgresql://postgres:%SENHA_TESTE%@localhost:5432/vouali_vendas?schema=public"
    echo.
)

set PGPASSWORD=
pause

