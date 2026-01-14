# Configuração do Banco de Dados PostgreSQL

## 📋 Passo 1: Criar arquivo .env

Crie um arquivo chamado `.env` na raiz do projeto (mesmo nível do `package.json`).

## 📝 Passo 2: Configurar DATABASE_URL

Cole o seguinte conteúdo no arquivo `.env`:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/vouali_vendas?schema=public"
```

### ⚠️ ONDE SUBSTITUIR A SENHA:

**Na linha acima, substitua `SUA_SENHA_AQUI` pela senha real do seu PostgreSQL.**

### Exemplo prático:

Se a senha do seu PostgreSQL for `admin123`, a linha ficará assim:

```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/vouali_vendas?schema=public"
```

### Estrutura da URL explicada:

```
postgresql://[USUARIO]:[SENHA]@[HOST]:[PORTA]/[BANCO]?schema=public
```

- **USUARIO**: `postgres` ← Não altere
- **SENHA**: `SUA_SENHA_AQUI` ← **SUBSTITUA AQUI PELA SUA SENHA**
- **HOST**: `localhost` ← Não altere
- **PORTA**: `5432` ← Não altere
- **BANCO**: `vouali_vendas` ← Não altere (banco já existe)

## ✅ Passo 3: Verificar configuração do Prisma

O Prisma está configurado corretamente no arquivo `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Isso significa que o Prisma vai ler a variável `DATABASE_URL` do arquivo `.env`.

## 🚀 Passo 4: Executar migração

Após configurar o `.env`, execute no terminal:

```bash
npx prisma migrate dev
```

Ou use o script:
```bash
npm run db:push
```

## ❌ Possíveis erros de conexão e soluções:

### Erro 1: "Can't reach database server"
**Causa**: PostgreSQL não está rodando
**Solução**: Inicie o serviço PostgreSQL

### Erro 2: "password authentication failed"
**Causa**: Senha incorreta na DATABASE_URL
**Solução**: Verifique se substituiu `SUA_SENHA_AQUI` pela senha correta

### Erro 3: "database 'vouali_vendas' does not exist"
**Causa**: Banco de dados não foi criado
**Solução**: Crie o banco no PostgreSQL:
```sql
CREATE DATABASE vouali_vendas;
```

### Erro 4: "connection refused"
**Causa**: PostgreSQL não está escutando na porta 5432
**Solução**: Verifique se a porta está correta ou se o PostgreSQL está rodando

### Erro 5: "role 'postgres' does not exist"
**Causa**: Usuário diferente no PostgreSQL
**Solução**: Substitua `postgres` pelo seu usuário na DATABASE_URL

## ✅ Verificação final

Se a conexão funcionar, você verá:
- Tabelas criadas no banco `vouali_vendas`
- Mensagem de sucesso do Prisma

Para verificar as tabelas:
```bash
npx prisma studio
```

Isso abrirá uma interface visual do banco de dados.

