@echo off
echo ========================================
echo   Testando Conexao com PostgreSQL
echo ========================================
echo.

echo Verificando se o arquivo .env existe...
if not exist ".env" (
    echo.
    echo ERRO: Arquivo .env nao encontrado!
    echo.
    echo Crie o arquivo .env na raiz do projeto com:
    echo DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/vouali_vendas?schema=public"
    echo.
    echo IMPORTANTE: Substitua SUA_SENHA_AQUI pela senha real do PostgreSQL
    echo.
    pause
    exit /b 1
)

echo Arquivo .env encontrado!
echo.

echo Validando schema do Prisma...
call npx prisma validate
if errorlevel 1 (
    echo.
    echo ERRO: Schema do Prisma invalido
    pause
    exit /b 1
)
echo Schema valido!
echo.

echo Testando conexao com o banco de dados...
call npx prisma db push --skip-generate
if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO DE CONEXAO
    echo ========================================
    echo.
    echo Possiveis causas:
    echo 1. PostgreSQL nao esta rodando
    echo 2. Senha incorreta no arquivo .env
    echo    - Verifique se substituiu SUA_SENHA_AQUI pela senha real
    echo 3. Banco 'vouali_vendas' nao existe
    echo    - Crie o banco: CREATE DATABASE vouali_vendas;
    echo 4. Porta 5432 nao esta acessivel
    echo.
    echo Verifique o arquivo .env e tente novamente.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   CONEXAO OK!
echo ========================================
echo.
echo Banco de dados 'vouali_vendas' esta acessivel e pronto para uso.
echo.
echo Executando seed para criar usuario admin e lote...
call npm run db:seed
echo.
echo Configuracao concluida!
echo.
pause

