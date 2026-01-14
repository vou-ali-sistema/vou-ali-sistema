# Como Usar PostgreSQL sem Senha

## 🔓 Se o PostgreSQL estiver sem senha

Se você configurou o PostgreSQL sem senha (ou a senha está vazia), você tem duas opções:

## ✅ Opção 1: Usar sem senha no .env

### Formato da DATABASE_URL sem senha:

```
DATABASE_URL="postgresql://postgres@localhost:5432/vouali_vendas?schema=public"
```

**Note que não tem `:senha` entre `postgres` e `@`**

### Como configurar:

1. Abra o arquivo `.env`
2. Localize a linha `DATABASE_URL`
3. Remova a parte da senha, deixando assim:

```
DATABASE_URL="postgresql://postgres@localhost:5432/vouali_vendas?schema=public"
```

4. Salve o arquivo
5. Execute `testar-conexao.bat`

### Ou use o script automático:

Execute:
```bash
configurar-sem-senha.bat
```

Este script atualiza o `.env` automaticamente para usar sem senha.

## 🔒 Opção 2: Definir uma senha (RECOMENDADO)

Mesmo que esteja sem senha, é recomendado definir uma para segurança:

1. Execute: `redefinir-senha-postgres.bat`
2. Defina uma senha nova
3. Use essa senha no arquivo `.env`

## 📝 Comparação

### Com senha:
```
DATABASE_URL="postgresql://postgres:minhasenha123@localhost:5432/vouali_vendas?schema=public"
                                    ^^^^^^^^^^^^^^
                                    senha aqui
```

### Sem senha:
```
DATABASE_URL="postgresql://postgres@localhost:5432/vouali_vendas?schema=public"
                                    ^
                                    sem senha (direto para @)
```

## ⚠️ Importante

- **Desenvolvimento local**: Pode usar sem senha
- **Produção**: SEMPRE use senha por segurança!

## 🧪 Testar

Depois de configurar, execute:
```bash
testar-conexao.bat
```

Se funcionar, você verá a mensagem de sucesso!

