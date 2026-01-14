# Configuração do .env

## Passo 1: Criar arquivo .env

Copie o arquivo `.env.example` para `.env` na raiz do projeto.

## Passo 2: Configurar DATABASE_URL

Abra o arquivo `.env` e localize a linha:

```
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/vouali_vendas?schema=public"
```

### Onde substituir a senha:

**Substitua `SUA_SENHA_AQUI` pela senha real do seu PostgreSQL.**

Exemplo:
- Se sua senha do PostgreSQL for `minhasenha123`, a linha ficará:
```
DATABASE_URL="postgresql://postgres:minhasenha123@localhost:5432/vouali_vendas?schema=public"
```

### Estrutura da URL de conexão:

```
postgresql://[USUARIO]:[SENHA]@[HOST]:[PORTA]/[BANCO]?schema=public
```

- **USUARIO**: `postgres` (não altere)
- **SENHA**: `SUA_SENHA_AQUI` ← **SUBSTITUA AQUI**
- **HOST**: `localhost` (não altere)
- **PORTA**: `5432` (não altere)
- **BANCO**: `vouali_vendas` (não altere)

## Passo 3: Verificar conexão

Após configurar, execute:
```bash
npx prisma db push
```

Se houver erro de conexão, verifique:
1. PostgreSQL está rodando?
2. A senha está correta?
3. O banco `vouali_vendas` existe?

