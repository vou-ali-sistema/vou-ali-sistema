@echo off
echo ========================================
echo   Criando arquivo .env
echo ========================================
echo.

if exist ".env" (
    echo Arquivo .env ja existe!
    echo.
    choice /C SN /M "Deseja sobrescrever"
    if errorlevel 2 goto :fim
    if errorlevel 1 goto :criar
) else (
    goto :criar
)

:criar
echo.
echo Criando arquivo .env...
echo.

(
echo # Database
echo # IMPORTANTE: Substitua SUA_SENHA_AQUI pela senha real do seu PostgreSQL
echo DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/vouali_vendas?schema=public"
echo.
echo # NextAuth
echo NEXTAUTH_URL="http://localhost:3000"
echo NEXTAUTH_SECRET="altere-esta-chave-para-uma-chave-secreta-aleatoria-em-producao"
echo.
echo # Mercado Pago
echo MERCADOPAGO_ACCESS_TOKEN="seu-token-do-mercadopago-aqui"
echo MERCADOPAGO_WEBHOOK_SECRET="seu-webhook-secret-aqui"
echo.
echo # Email
echo EMAIL_FROM="blocovouali@gmail.com"
echo EMAIL_PASSWORD="sua-senha-de-app-do-email-aqui"
echo.
echo # App Base URL ^(opcional, usa NEXTAUTH_URL se nao definido^)
echo APP_BASE_URL="http://localhost:3000"
) > .env

if exist ".env" (
    echo Arquivo .env criado com sucesso!
    echo.
    echo ========================================
    echo   PROXIMO PASSO
    echo ========================================
    echo.
    echo 1. Abra o arquivo .env que foi criado
    echo 2. Localize a linha com DATABASE_URL
    echo 3. Se o PostgreSQL TEM senha:
    echo    - Substitua SUA_SENHA_AQUI pela senha real
    echo    - Exemplo: DATABASE_URL="postgresql://postgres:admin123@localhost:5432/vouali_vendas?schema=public"
    echo.
    echo 4. Se o PostgreSQL NAO TEM senha:
    echo    - Remova a parte ":SUA_SENHA_AQUI"
    echo    - Ficara: DATABASE_URL="postgresql://postgres@localhost:5432/vouali_vendas?schema=public"
    echo    - OU execute: configurar-sem-senha.bat
    echo.
) else (
    echo ERRO: Nao foi possivel criar o arquivo .env
    echo.
    echo Tente criar manualmente copiando o conteudo de .env.example
)

:fim
pause

