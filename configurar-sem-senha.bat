@echo off
echo ========================================
echo   Configurar .env para PostgreSQL sem senha
echo ========================================
echo.

if not exist ".env" (
    echo Arquivo .env nao encontrado!
    echo Execute primeiro: criar-env.bat
    pause
    exit /b 1
)

echo.
echo IMPORTANTE: Esta configuracao e para desenvolvimento local.
echo Para producao, sempre use senha!
echo.
pause

echo.
echo Atualizando arquivo .env para usar PostgreSQL sem senha...
echo.

REM Criar backup
copy .env .env.backup >nul 2>&1

REM Atualizar DATABASE_URL removendo a parte da senha
powershell -Command "(Get-Content .env) -replace 'postgres:SUA_SENHA_AQUI@', 'postgres@' -replace 'postgres:.*@', 'postgres@' | Set-Content .env.tmp"
move /Y .env.tmp .env >nul 2>&1

echo.
echo Arquivo .env atualizado!
echo.
echo A linha DATABASE_URL agora esta assim:
echo DATABASE_URL="postgresql://postgres@localhost:5432/vouali_vendas?schema=public"
echo.
echo Testando conexao...
echo.

call npx prisma db push --skip-generate
if errorlevel 1 (
    echo.
    echo ERRO: Nao foi possivel conectar.
    echo.
    echo Possiveis causas:
    echo 1. PostgreSQL nao esta rodando
    echo 2. O banco 'vouali_vendas' nao existe
    echo 3. O PostgreSQL realmente exige senha
    echo.
    echo Se o PostgreSQL exige senha, voce precisa:
    echo 1. Descobrir a senha, OU
    echo 2. Executar: redefinir-senha-postgres.bat
    echo.
) else (
    echo.
    echo ========================================
    echo   CONEXAO OK!
    echo ========================================
    echo.
    echo PostgreSQL conectado sem senha!
    echo.
    echo IMPORTANTE: Para seguranca, considere definir uma senha.
    echo Execute: redefinir-senha-postgres.bat
    echo.
)

pause

