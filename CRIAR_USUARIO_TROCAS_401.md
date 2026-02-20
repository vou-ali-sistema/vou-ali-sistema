# Corrigir 401 ao entrar com vouali.trocas

Quando o login **vouali.trocas** retorna **401 (Unauthorized)**, em geral o usuário ainda não existe no banco de **produção**.

## Opção 1: Pelo navegador (sem estar logado)

1. Na **Vercel** (ou onde está o projeto), abra o projeto → **Settings** → **Environment Variables**.
2. Copie o valor da variável **NEXTAUTH_SECRET** (não mostre para outras pessoas).
3. No navegador, abra esta URL **trocando** `SEU_NEXTAUTH_SECRET` pelo valor copiado:
   ```
   https://www.blocovouali.com/api/setup-trocas-user?token=SEU_NEXTAUTH_SECRET
   ```
4. A página deve mostrar algo como: `{"ok":true,"message":"Usuário vouali.trocas criado...","login":"vouali.trocas","senha":"112233"}`.
5. Volte para o login e entre com:
   - **Email/usuário:** vouali.trocas  
   - **Senha:** 112233  

## Opção 2: Pelo Dashboard (se você já entra como admin)

1. Faça login como **admin** (ex.: admin@vouali.com).
2. Vá em **Dashboard**.
3. Clique no botão **"Criar/atualizar usuário trocas"** (ou texto parecido).
4. Depois faça login com **vouali.trocas** / **112233**.

---

**Senha do perfil Trocas:** 112233 (apenas números).
