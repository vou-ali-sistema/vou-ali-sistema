# Guia: para que serve cada arquivo .env

No Next.js, arquivos `.env*` são carregados numa ordem definida; **a mesma variável em um arquivo “mais específico” sobrescreve a do anterior**. Todos esses arquivos estão no `.gitignore` (não vão para o Git).

---

## Seus arquivos hoje

| Arquivo | Para que serve |
|--------|-----------------|
| **`.env`** | Base do projeto: banco **local** (PostgreSQL na sua máquina), URLs **localhost**, **Mercado Pago** (token e webhook secret), **Email**. É o que você usa quando roda `npm run dev` **sem** outros .env, ou como fallback. |
| **`.env.local`** | Criado/atualizado pela **Vercel CLI** (ex.: `vercel env pull`). Contém variáveis do **projeto na Vercel**: banco **Neon** (produção), `APP_BASE_URL`/`NEXTAUTH_URL` do site em produção, BLOB, Neon, etc. Útil para rodar o app **localmente** com as mesmas configs da Vercel (ou uma cópia delas). **Na Vercel (deploy), quem manda são as variáveis do painel**, não este arquivo. |
| **`.env.development.local`** | Override **só em desenvolvimento** (`npm run dev`). Força **banco local** e **URLs localhost** quando você quer desenvolver na máquina sem usar o banco/URL da Vercel. As variáveis que estão aqui **sobrescrevem** as de `.env` e `.env.local` em modo dev. |
| **`.env.backup`** | Cópia de segurança / modelo: mesmo esquema do `.env`, mas com placeholders no lugar dos tokens (para não commitar segredos). Não é lido pelo Next.js. |

---

## Ordem de carregamento (Next.js)

Em **desenvolvimento** (`npm run dev`), a ordem típica é:

1. `.env`
2. `.env.development` (se existir)
3. `.env.local`
4. `.env.development.local` (se existir)

**O último valor “vence”.** Exemplo: se `DATABASE_URL` estiver em `.env` (local) e em `.env.local` (Neon), e você tiver `.env.development.local` com `DATABASE_URL` (local), no `npm run dev` vale a do `.env.development.local`.

---

## O que verificar para o Mercado Pago (compras registradas)

- **Na sua máquina** (dev): quem manda é a **mesma variável** que “vencer” na ordem acima. Para pagamento funcionar em dev você precisa de:
  - `MERCADOPAGO_ACCESS_TOKEN` (em `.env` ou `.env.local` ou `.env.development.local`)
  - `APP_BASE_URL` ou `NEXTAUTH_URL` em **HTTPS** se quiser webhook em dev (ex.: ngrok); senão use só o link de pagamento e confirme no admin.
- **Na Vercel (produção)**:
  - As variáveis vêm **só do painel** (Settings → Environment Variables). Os arquivos `.env` do repositório **não** são usados no deploy.
  - Garanta no painel: `MERCADOPAGO_ACCESS_TOKEN` (produção), `APP_BASE_URL` e/ou `NEXTAUTH_URL` com a URL **HTTPS** do site (ex.: `https://www.blocovouali.com`).

---

## Resumo rápido

- **`.env`** = base (local + MP + email).
- **`.env.local`** = cópia do que está (ou esteve) na Vercel; usado para rodar igual à produção na sua máquina.
- **`.env.development.local`** = “em dev, usar banco e URLs locais” (sobrescreve o resto no `npm run dev`).
- **`.env.backup`** = só backup/modelo; Next.js não usa.

Se quiser **só um arquivo** na máquina: pode usar só o `.env` com tudo (local ou produção) e apagar ou deixar vazios os `.local`; o importante é não commitar segredos e, na Vercel, configurar as variáveis no painel.
