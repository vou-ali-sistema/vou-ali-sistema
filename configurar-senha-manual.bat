@echo off
echo ========================================
echo   Configurar Senha do PostgreSQL Manualmente
echo ========================================
echo.
echo Este script vai ajudar voce a configurar a senha correta.
echo.

if not exist ".env" (
    echo ERRO: Arquivo .env nao encontrado!
    echo Execute: criar-env.bat
    pause
    exit /b 1
)

echo IMPORTANTE: Voce precisa saber a senha do usuario 'postgres' do PostgreSQL.
echo.
echo Se voce nao sabe a senha:
echo 1. Tente lembrar a senha que voce definiu na instalacao
echo 2. Veja o arquivo: COMO_DESCOBRIR_SENHA_POSTGRESQL.md
echo 3. Ou execute: redefinir-senha-postgres.bat
echo.
echo.

set /p SENHA="Digite a senha do PostgreSQL (ou deixe em branco para tentar sem senha): "

echo.
echo Testando conexao...

if "%SENHA%"=="" (
    echo Testando sem senha...
    powershell -Command "$content = Get-Content .env; $content = $content -replace 'postgres:.*@', 'postgres@'; $content | Set-Content .env"
) else (
    echo Testando com a senha informada...
    powershell -Command "$content = Get-Content .env; $content = $content -replace 'postgres:.*@', 'postgres:%SENHA%@'; $content | Set-Content .env"
)

echo.
call npx prisma db push --skip-generate
if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO: Conexao falhou
    echo ========================================
    echo.
    echo A senha informada nao esta correta ou ha outro problema.
    echo.
    echo Verifique:
    echo 1. A senha esta correta?
    echo 2. O PostgreSQL esta rodando?
    echo 3. O banco 'vouali_vendas' existe?
    echo.
    echo Tente novamente ou veja: COMO_DESCOBRIR_SENHA_POSTGRESQL.md
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCESSO!
echo ========================================
echo.
echo A conexao com o banco de dados esta funcionando!
echo O arquivo .env foi atualizado com a configuracao correta.
echo.
echo Agora voce pode executar: INICIAR_SISTEMA.bat
echo.
pause
