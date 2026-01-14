@echo off
echo ========================================
echo   Diagnosticar Problema de Conexao
echo ========================================
echo.

REM Verificar se .env existe
if not exist ".env" (
    echo ERRO: Arquivo .env nao encontrado!
    echo Execute: criar-env.bat
    pause
    exit /b 1
)

echo [1/5] Verificando se PostgreSQL esta rodando...
netstat -ano | findstr :5432 >nul 2>&1
if errorlevel 1 (
    echo ERRO: PostgreSQL nao esta acessivel na porta 5432
    echo Verifique se o PostgreSQL esta instalado e rodando
    pause
    exit /b 1
)
echo [OK] PostgreSQL esta acessivel
echo.

echo [2/5] Fazendo backup do .env atual...
copy .env .env.backup >nul 2>&1
echo [OK] Backup criado: .env.backup
echo.

echo [3/5] Testando conexao SEM senha...
powershell -Command "$content = Get-Content .env; $content = $content -replace 'postgres:.*@', 'postgres@'; $content | Set-Content .env.teste"
call npx prisma db push --skip-generate --schema=prisma\schema.prisma >nul 2>&1
if not errorlevel 1 (
    echo [OK] Conexao funcionou SEM senha!
    echo.
    echo Atualizando .env para usar sem senha...
    move /Y .env.teste .env >nul 2>&1
    echo.
    echo ========================================
    echo   PROBLEMA RESOLVIDO!
    echo ========================================
    echo.
    echo O arquivo .env foi atualizado para usar PostgreSQL sem senha.
    echo.
    pause
    exit /b 0
)
copy .env.backup .env >nul 2>&1
echo [X] Nao funcionou sem senha
echo.

echo [4/5] Testando senhas comuns...
echo.

REM Senhas comuns para testar
set SENHAS_TESTE=postgres admin 123456 root password admin123 postgres123

for %%s in (%SENHAS_TESTE%) do (
    echo Testando senha: %%s
    powershell -Command "$content = Get-Content .env.backup; $content = $content -replace 'postgres:.*@', 'postgres:%%s@'; $content | Set-Content .env.teste"
    call npx prisma db push --skip-generate --schema=prisma\schema.prisma >nul 2>&1
    if not errorlevel 1 (
        echo.
        echo ========================================
        echo   SENHA ENCONTRADA: %%s
        echo ========================================
        echo.
        echo Atualizando .env com a senha correta...
        move /Y .env.teste .env >nul 2>&1
        echo.
        echo ========================================
        echo   PROBLEMA RESOLVIDO!
        echo ========================================
        echo.
        echo O arquivo .env foi atualizado com a senha: %%s
        echo.
        pause
        exit /b 0
    )
)

copy .env.backup .env >nul 2>&1
del .env.teste >nul 2>&1
echo.
echo [5/6] Nenhuma senha comum funcionou
echo.

echo [6/6] Verificando se o banco existe...
echo.
echo Tentando criar o banco de dados se nao existir...
echo.

REM Tentar criar banco usando psql se disponivel
where psql >nul 2>&1
if not errorlevel 1 (
    echo Digite a senha quando solicitado (ou pressione Enter se nao tiver senha):
    echo CREATE DATABASE vouali_vendas; | psql -U postgres -h localhost 2>nul
    echo.
)

echo ========================================
echo   DIAGNOSTICO COMPLETO
echo ========================================
echo.
echo Nao foi possivel conectar automaticamente.
echo.
echo OPCOES:
echo.
echo 1. Tente descobrir a senha:
echo    - Execute: testar-senha-postgres.bat
echo    - Ou veja: COMO_DESCOBRIR_SENHA_POSTGRESQL.md
echo.
echo 2. Configure para usar sem senha:
echo    - Execute: configurar-sem-senha.bat
echo    - (Requer configuracao do pg_hba.conf)
echo.
echo 3. Redefina a senha:
echo    - Execute: redefinir-senha-postgres.bat
echo.
echo 4. Verifique se o banco existe:
echo    - Abra pgAdmin ou psql
echo    - Execute: CREATE DATABASE vouali_vendas;
echo.
pause
