# Como publicar a coluna "Já entrou?" no site (blocovouali.com)

A funcionalidade **"Já entrou?"** já está no código. Para ela aparecer em **https://www.blocovouali.com/admin/lista-convidados**, é preciso **fazer um novo deploy**.

## Passo a passo

### 1. Abrir o terminal na pasta do projeto

```bash
cd "c:\Users\Nicholas Cordeiro\Desktop\VOU_ALI_SISTEMA"
```

### 2. Ver o que foi alterado

```bash
git status
```

Você deve ver arquivos como:
- `app/admin/lista-convidados/page.tsx`
- `app/api/admin/lista-convidados/route.ts`
- `app/api/admin/lista-convidados/[id]/route.ts`
- `prisma/schema.prisma`

### 3. Adicionar tudo e fazer commit

```bash
git add app/admin/lista-convidados/page.tsx app/api/admin/lista-convidados/route.ts "app/api/admin/lista-convidados/[id]/route.ts" prisma/schema.prisma
git commit -m "Lista de convidados: coluna e bloco Já entrou?"
```

(Se aparecerem outros arquivos modificados que você queira incluir, use `git add .` e depois o commit.)

### 4. Enviar para o repositório (GitHub/GitLab etc.)

```bash
git push origin main
```

(Se a branch for `master`, use: `git push origin master`.)

### 5. Deploy na Vercel

- Se o projeto está **conectado à Vercel**, um **novo deploy começa sozinho** depois do `git push`.
- Acesse o painel da Vercel → seu projeto → aba **Deployments** e espere o último deploy terminar (status "Ready").
- O script `vercel-build` já roda `prisma db push` e `prisma generate`, então a coluna `entrou` será criada no banco em produção (desde que `DATABASE_URL` esteja configurada na Vercel).

### 6. Testar no site

- Abra: **https://www.blocovouali.com/admin/lista-convidados**
- Faça um **refresh forçado**: `Ctrl + Shift + R` (ou `Ctrl + F5`).
- Você deve ver:
  - O bloco verde **"Quem já entrou?"** com um checkbox ao lado de cada convidado.
  - A tabela com a primeira coluna **"Já entrou?"** e os checkboxes.

---

**Se não usar Git:** faça o upload dos arquivos alterados pela interface da Vercel (ou do seu provedor) e dispare um novo build. Os arquivos que precisam estar atualizados são os listados no passo 2.
