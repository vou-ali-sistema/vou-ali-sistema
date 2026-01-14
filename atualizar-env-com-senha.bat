@echo off
echo ========================================
echo   Atualizando .env com senha postgres
echo ========================================
echo.

if not exist ".env" (
    echo Arquivo .env nao encontrado!
    echo Criando arquivo .env...
    call criar-env.bat
    echo.
)

echo Atualizando DATABASE_URL com senha 'postgres'...
echo.

REM Atualizar a linha DATABASE_URL
powershell -Command "$content = Get-Content .env; $content = $content -replace 'DATABASE_URL=.*', 'DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/vouali_vendas?schema=public\"'; $content | Set-Content .env"

echo Arquivo .env atualizado!
echo.
echo DATABASE_URL configurado como:
echo postgresql://postgres:postgres@localhost:5432/vouali_vendas?schema=public
echo.
pause

