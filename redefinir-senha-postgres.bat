@echo off
echo ========================================
echo   Redefinir Senha do PostgreSQL
echo ========================================
echo.
echo Este script vai ajudar voce a redefinir a senha do PostgreSQL.
echo.
echo IMPORTANTE: Voce precisa ter acesso administrativo.
echo.
pause
echo.

echo [1/5] Localizando arquivo pg_hba.conf...
echo.
echo O arquivo geralmente esta em:
echo C:\Program Files\PostgreSQL\[versao]\data\pg_hba.conf
echo OU
echo C:\ProgramData\PostgreSQL\[versao]\data\pg_hba.conf
echo.
echo Por favor, abra o arquivo pg_hba.conf manualmente.
echo.
pause

echo.
echo [2/5] Instrucoes para editar pg_hba.conf:
echo.
echo 1. Encontre a linha que comeca com:
echo    # IPv4 local connections:
echo    host    all             all             127.0.0.1/32            scram-sha-256
echo.
echo 2. Altere "scram-sha-256" para "trust"
echo    host    all             all             127.0.0.1/32            trust
echo.
echo 3. Salve o arquivo
echo.
pause

echo.
echo [3/5] Reiniciando servico PostgreSQL...
echo.
echo Abrindo gerenciador de servicos...
echo Encontre o servico "postgresql-x64-[versao]" e reinicie-o.
echo.
start services.msc
pause

echo.
echo [4/5] Conectando ao PostgreSQL sem senha...
echo.
echo Agora vamos conectar e definir uma nova senha.
echo.
set /p NOVA_SENHA="Digite a nova senha que deseja usar: "

echo.
echo Conectando e definindo nova senha...
echo.

psql -U postgres -c "ALTER USER postgres WITH PASSWORD '%NOVA_SENHA%';"

if errorlevel 1 (
    echo.
    echo ERRO: Nao foi possivel conectar ou alterar a senha.
    echo.
    echo Tente executar manualmente:
    echo psql -U postgres
    echo.
    echo Depois dentro do psql:
    echo ALTER USER postgres WITH PASSWORD 'sua_senha_aqui';
    echo.
    pause
    exit /b 1
)

echo.
echo [5/5] Senha alterada com sucesso!
echo.
echo IMPORTANTE: Agora voce precisa:
echo 1. Voltar ao arquivo pg_hba.conf
echo 2. Mudar "trust" de volta para "scram-sha-256"
echo 3. Reiniciar o PostgreSQL novamente
echo.
echo Sua nova senha e: %NOVA_SENHA%
echo.
echo Atualize o arquivo .env com esta senha!
echo.
pause

