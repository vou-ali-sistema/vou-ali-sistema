@echo off
chcp 65001 >nul
echo ========================================
echo   CONFIGURAR MERCADO PAGO
echo ========================================
echo.
echo Este script vai ajudar você a configurar o token do Mercado Pago.
echo.
echo PASSO 1: Obter o Token
echo ----------------------
echo 1. Acesse: https://www.mercadopago.com.br/developers/panel/app
echo 2. Faça login (ou crie uma conta)
echo 3. Crie uma nova aplicação ou selecione uma existente
echo 4. Vá na aba "Credenciais de teste"
echo 5. Copie o "Access Token"
echo.
echo PASSO 2: Colar o Token aqui
echo ----------------------------
echo.
set /p TOKEN="Cole o Access Token aqui: "

if "%TOKEN%"=="" (
    echo.
    echo ERRO: Token não pode estar vazio!
    pause
    exit /b 1
)

echo.
echo Configurando o token no arquivo .env...
echo.

REM Verificar se o arquivo .env existe
if not exist ".env" (
    echo Arquivo .env não encontrado!
    echo Execute primeiro: criar-env.bat
    pause
    exit /b 1
)

REM Atualizar ou adicionar o token no .env
powershell -Command "$content = Get-Content .env -Raw; if ($content -match 'MERCADOPAGO_ACCESS_TOKEN=') { $content = $content -replace 'MERCADOPAGO_ACCESS_TOKEN=.*', 'MERCADOPAGO_ACCESS_TOKEN=\"%TOKEN%\"' } else { $content += \"`nMERCADOPAGO_ACCESS_TOKEN=`\"%TOKEN%`\"`n\" }; Set-Content .env -Value $content -NoNewline"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCESSO!
    echo ========================================
    echo.
    echo Token do Mercado Pago configurado com sucesso!
    echo.
    echo IMPORTANTE: Reinicie o servidor para aplicar as mudanças.
    echo.
    echo Pressione qualquer tecla para abrir o arquivo .env e verificar...
    pause >nul
    notepad .env
) else (
    echo.
    echo ERRO ao configurar o token!
    echo Tente editar o arquivo .env manualmente.
    pause
)
