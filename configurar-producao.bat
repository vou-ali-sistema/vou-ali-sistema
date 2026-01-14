@echo off
chcp 65001 >nul
echo ========================================
echo   CONFIGURAR PARA PRODUCAO
echo   (Pagamentos Reais)
echo ========================================
echo.
echo ⚠️  ATENCAO: Esta configuracao processara PAGAMENTOS REAIS!
echo.
echo Certifique-se de que:
echo - O sistema esta funcionando corretamente
echo - Voce testou tudo em ambiente de teste
echo - Voce tem uma conta do Mercado Pago verificada
echo.
pause

echo.
echo PASSO 1: Obter Token de Producao
echo --------------------------------
echo 1. Acesse: https://www.mercadopago.com.br/developers/panel/app
echo 2. Faca login com sua conta do Mercado Pago
echo 3. Selecione sua aplicacao
echo 4. Va na aba "Credenciais de PRODUCAO" (nao teste!)
echo 5. Copie o "Access Token"
echo.
pause

echo.
echo PASSO 2: Configurar Token
echo -------------------------
set /p TOKEN="Cole o Access Token de PRODUCAO aqui: "

if "%TOKEN%"=="" (
    echo.
    echo ERRO: Token nao pode estar vazio!
    pause
    exit /b 1
)

echo.
echo PASSO 3: Configurar URL de Producao
echo ------------------------------------
set /p DOMINIO="Digite seu dominio (ex: https://blocovouali.com.br): "

if "%DOMINIO%"=="" (
    echo.
    echo ERRO: Dominio nao pode estar vazio!
    pause
    exit /b 1
)

echo.
echo Configurando...
echo.

REM Verificar se o arquivo .env existe
if not exist ".env" (
    echo Arquivo .env nao encontrado!
    echo Execute primeiro: criar-env.bat
    pause
    exit /b 1
)

REM Atualizar token e URLs
powershell -Command "$content = Get-Content .env -Raw; $content = $content -replace 'MERCADOPAGO_ACCESS_TOKEN=.*', 'MERCADOPAGO_ACCESS_TOKEN=\"%TOKEN%\"'; $content = $content -replace 'NEXTAUTH_URL=.*', 'NEXTAUTH_URL=\"%DOMINIO%\"'; $content = $content -replace 'APP_BASE_URL=.*', 'APP_BASE_URL=\"%DOMINIO%\"'; Set-Content .env -Value $content -NoNewline"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCESSO!
    echo ========================================
    echo.
    echo Configuracao de producao aplicada!
    echo.
    echo IMPORTANTE:
    echo - Reinicie o servidor para aplicar as mudancas
    echo - Certifique-se de que seu dominio tem HTTPS
    echo - Configure o webhook no painel do Mercado Pago
    echo.
    echo Pressione qualquer tecla para abrir o arquivo .env e verificar...
    pause >nul
    notepad .env
) else (
    echo.
    echo ERRO ao configurar!
    echo Tente editar o arquivo .env manualmente.
    pause
)
