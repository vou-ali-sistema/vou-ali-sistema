@echo off
echo ========================================
echo   Configurando .env com senha postgres
echo ========================================
echo.

if not exist ".env" (
    echo Criando arquivo .env...
    call criar-env.bat
    echo.
)

echo Atualizando DATABASE_URL...
echo.

(
echo # Database
echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vouali_vendas?schema=public"
echo.
echo # NextAuth
echo NEXTAUTH_URL="http://localhost:3000"
echo NEXTAUTH_SECRET="altere-esta-chave-para-uma-chave-secreta-aleatoria-em-producao"
echo.
echo # Mercado Pago
echo MERCADOPAGO_ACCESS_TOKEN="seu-token-do-mercadopago-aqui"
echo MERCADOPAGO_WEBHOOK_SECRET="seu-webhook-secret-aqui"
echo.
echo # App Base URL
echo APP_BASE_URL="http://localhost:3000"
) > .env

echo Arquivo .env atualizado com sucesso!
echo.
echo DATABASE_URL configurado como:
echo postgresql://postgres:postgres@localhost:5432/vouali_vendas?schema=public
echo.
echo ========================================
echo   Proximo passo: Executar migracao
echo ========================================
echo.
echo Execute no terminal:
echo   npx prisma migrate dev
echo.
echo Ou execute: start.bat
echo.
pause

