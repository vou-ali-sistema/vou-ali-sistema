# Como Descobrir ou Redefinir a Senha do PostgreSQL

## 🔍 Opção 1: Verificar se você definiu uma senha

Se você instalou o PostgreSQL recentemente, pode ter definido uma senha durante a instalação. Tente lembrar:

- Senha que você definiu na instalação
- Senha padrão que você costuma usar
- Se deixou em branco (pode ser vazio)

## 🔑 Opção 2: Redefinir a senha do PostgreSQL

### Método A: Via pgAdmin (Interface Gráfica)

1. Abra o **pgAdmin** (geralmente instalado com o PostgreSQL)
2. Conecte-se ao servidor local
3. Clique com botão direito no servidor → **Properties**
4. Vá na aba **Connection**
5. Altere a senha ou veja se está salva

### Método B: Via linha de comando (psql)

1. Abra o **Prompt de Comando** ou **PowerShell** como Administrador
2. Execute:

```bash
psql -U postgres
```

Se pedir senha e você não souber, continue para o Método C.

### Método C: Redefinir senha via arquivo de configuração

1. Localize o arquivo `pg_hba.conf`:
   - Geralmente em: `C:\Program Files\PostgreSQL\[versão]\data\pg_hba.conf`
   - Ou: `C:\ProgramData\PostgreSQL\[versão]\data\pg_hba.conf`

2. Abra o arquivo como **Administrador**

3. Encontre a linha que começa com:
   ```
   # IPv4 local connections:
   host    all             all             127.0.0.1/32            scram-sha-256
   ```

4. Altere para:
   ```
   host    all             all             127.0.0.1/32            trust
   ```

5. **Salve o arquivo**

6. Reinicie o serviço PostgreSQL:
   - Abra **Serviços** (services.msc)
   - Encontre **postgresql-x64-[versão]**
   - Clique com botão direito → **Reiniciar**

7. Agora você pode conectar sem senha:
   ```bash
   psql -U postgres
   ```

8. Dentro do psql, defina uma nova senha:
   ```sql
   ALTER USER postgres WITH PASSWORD 'sua_nova_senha_aqui';
   ```

9. Volte ao arquivo `pg_hba.conf` e mude de volta para `scram-sha-256`

10. Reinicie o PostgreSQL novamente

## 🆕 Opção 3: Criar um novo usuário (se não conseguir acessar postgres)

Se você não conseguir acessar o usuário `postgres`, pode criar um novo:

1. Tente acessar com outro usuário que você tenha criado
2. Ou use o método C acima para acessar sem senha primeiro

## ✅ Opção 4: Verificar senha salva no Windows

Algumas instalações do PostgreSQL salvam credenciais no Windows Credential Manager:

1. Abra **Gerenciador de Credenciais do Windows**
2. Vá em **Credenciais do Windows**
3. Procure por entradas relacionadas a **PostgreSQL**
4. Veja se há senha salva lá

## 🎯 Opção 5: Usar senha padrão comum

Algumas instalações usam senhas padrão:
- `postgres`
- `admin`
- `123456`
- Senha em branco (vazio)

**Tente essas opções antes de redefinir!**

## 📝 Depois de descobrir/definir a senha

1. Abra o arquivo `.env` no projeto
2. Substitua `SUA_SENHA_AQUI` pela senha real
3. Salve o arquivo
4. Execute `testar-conexao.bat` para testar

## ⚠️ Dica Importante

Se você definir uma nova senha, anote em um local seguro! Você precisará dela sempre que:
- Conectar ao banco de dados
- Executar migrações
- Usar o sistema

