# Mercado Pago – Passo a passo: o que verificar e onde colar

Use este guia para conferir tudo no Mercado Pago e garantir que as vendas e o checkout funcionem.

---

## 1. Acessar o painel do Mercado Pago (Desenvolvedores)

1. Abra: **https://www.mercadopago.com.br/developers**
2. Faça login com a conta Mercado Pago que vai receber os pagamentos.
3. No menu, clique em **Suas integrações** (ou **Aplicativos**).

---

## 2. Escolher ou criar o aplicativo

1. Na lista de aplicativos, clique no app que você usa para o Bloco Vou Ali.
2. Se não tiver nenhum, clique em **Criar aplicativo** e preencha nome (ex.: "Bloco Vou Ali") e depois salve.

**O que anotar:**  
- Nome do aplicativo: _____________________

---

## 3. Credenciais de PRODUÇÃO (para receber dinheiro de verdade)

1. Dentro do app, vá em **Credenciais de produção** (ou **Produção** na aba de credenciais).
2. Confirme que está em **Credenciais de produção** e não em "Credenciais de teste".
3. Copie o **Access Token** de produção (começa com `APPUSR-...` e é longo).

**Onde colar:**

- **Vercel:**  
  - Projeto → **Settings** → **Environment Variables**  
  - Variável: `MERCADOPAGO_ACCESS_TOKEN`  
  - Valor: o Access Token de **produção** que você copiou  
  - Ambiente: **Production** (e, se quiser, Preview)  
  - Salve e faça um novo deploy.

- **Local (.env):**  
  - No arquivo `.env` ou `.env.local`:  
  - `MERCADOPAGO_ACCESS_TOKEN=APPUSR-...` (cole o token completo).

**O que verificar:**  
- [ ] Estou em **Credenciais de produção**.  
- [ ] Copiei o **Access Token** de produção.  
- [ ] Colei no Vercel em `MERCADOPAGO_ACCESS_TOKEN` (e/ou no .env local).

---

## 4. Webhooks (para o pedido virar PAGO no seu sistema)

1. No mesmo app, no menu lateral, abra **Webhooks** (pode estar em "Notificações" ou "Configurações").
2. Clique em **Configurar notificações** ou **Adicionar URL**.
3. Em **URL de notificação** (ou "URL de webhook"), coloque exatamente:

   ```
   https://www.blocovouali.com/api/webhooks/mercadopago
   ```

   (Se seu domínio for outro, troque: `https://SEU-DOMINIO.com/api/webhooks/mercadopago`)

4. Se pedir **eventos**, marque pelo menos: **Pagamentos** (ou "Payment").
5. Salve.

**O que verificar:**  
- [ ] URL de webhook configurada.  
- [ ] URL é HTTPS e termina em `/api/webhooks/mercadopago`.  
- [ ] Evento de pagamentos ativado.

---

## 5. Modo produção do aplicativo

1. No painel do app, procure **Modo** ou **Status** (Teste / Produção).
2. O app precisa estar em **Produção** (ou "Ativo em produção") para você receber pagamentos reais e as formas de pagamento aparecerem normalmente.
3. Se estiver em "Modo teste", altere para **Produção** e salve (se o MP pedir revisão, conclua o que for pedido).

**O que verificar:**  
- [ ] App em **Produção** (não só teste).

---

## 6. Formas de pagamento habilitadas na conta

1. Acesse **https://www.mercadopago.com.br/settings/release-options** (ou no menu da conta: **Configurações** → **Liberar opções de pagamento**).
2. Confira se estão liberados os meios que você quer: **Pix**, **Cartão de crédito/débito**, **Boleto**, etc.
3. Se algo estiver desativado, ative e salve.

**O que verificar:**  
- [ ] Pix ativado (se quiser Pix).  
- [ ] Cartão ativado (se quiser cartão).  
- [ ] Boleto ativado (se quiser boleto).

---

## 7. Resumo do que colar onde

| Onde | O que colar |
|------|-------------|
| **Vercel → Settings → Environment Variables** | Nome: `MERCADOPAGO_ACCESS_TOKEN` / Valor: **Access Token de produção** (Credenciais de produção do app). |
| **Mercado Pago → Webhooks** | URL: `https://www.blocovouali.com/api/webhooks/mercadopago` (ou seu domínio + `/api/webhooks/mercadopago`). |

---

## 8. Depois de configurar

1. No Vercel, dê **Redeploy** no projeto (para carregar o token novo).
2. No site, faça um **pedido de teste** (pode ser valor baixo).
3. Ao finalizar compra, deve abrir a aba do Mercado Pago com Pix, cartão, etc.
4. Conclua o pagamento (pode usar cartão de teste do MP em modo teste, ou pagamento real em produção).
5. Verifique no **admin** do seu site se o pedido apareceu como **PAGO**.

Se algo não bater (formas de pagamento não aparecem, pedido não vira PAGO), confira de novo: token de **produção** no Vercel, webhook com a URL certa e app em modo **Produção**.
