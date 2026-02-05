# Diagnóstico: Pagamento do Abadá parou de funcionar

## O que foi corrigido no código

1. **Webhook (notification_url)**  
   O Mercado Pago só consegue avisar seu sistema quando o pagamento é aprovado se a **notification_url** for enviada na hora de criar a preferência.  
   Antes, essa URL só era enviada quando a base não era "localhost". Se em produção a variável de ambiente da URL estivesse errada (vazia ou `http://...`), o sistema tratava como localhost e **não enviava** a notification_url. Resultado: o cliente pagava, mas o pedido não virava PAGO sozinho.  
   **Ajuste:** a notification_url agora é sempre enviada quando a URL base for **HTTPS** (produção ou ngrok). Assim o webhook é sempre registrado quando o site está em HTTPS.

2. **URL base em produção**  
   A URL usada para montar o webhook passou a priorizar `APP_BASE_URL` (ex.: `https://www.blocovouali.com`), para bater com o domínio que o usuário acessa.

---

## .env.local e Vercel

O `.env.local` que a Vercel CLI cria (ou que você preenche) é para **desenvolvimento local**. Ele está no `.gitignore`, então **não é enviado** no deploy. Na **produção**, a Vercel usa **só** as variáveis configuradas em **Vercel → projeto → Settings → Environment Variables**. Se você fez `vercel env pull`, o `.env.local` é uma **cópia** do que está no painel da Vercel (alguns secrets podem não vir no pull). Para produção funcionar, as variáveis precisam estar **no painel da Vercel**; o `.env.local` só afeta quando você roda o projeto na sua máquina.

---

## O que conferir na Vercel (produção)

1. **MERCADOPAGO_ACCESS_TOKEN**  
   - Em **Vercel → projeto → Settings → Environment Variables**.  
   - Precisa existir e ser o token de **produção** (não de teste).  
   - Se foi removido, expirado ou trocado, o link de pagamento e o webhook deixam de funcionar.

2. **APP_BASE_URL e/ou NEXTAUTH_URL**  
   - Devem ser **HTTPS** e o domínio real do site, por exemplo:  
     `https://www.blocovouali.com`  
   - Se estiver vazio ou `http://localhost:3000`, o sistema não envia a URL do webhook e o Mercado Pago não chama seu servidor quando o pagamento for aprovado.

3. **Redeploy**  
   - Depois de alterar variáveis de ambiente, fazer um novo deploy para as mudanças valerem.

---

## O que conferir no Admin do site

1. **Compras habilitadas**  
   - Na página inicial do admin deve aparecer algo como “Página de Compra” (e não “Página de Compra (bloqueada)”).  
   - Se estiver bloqueada, ninguém consegue finalizar compra; é só reativar o toggle.

---

## Fluxo do pagamento (resumo)

1. Cliente monta o pedido (abadá, etc.) e é criado um pedido **PENDENTE**.  
2. É criada uma preferência no Mercado Pago **com notification_url** (agora garantido em HTTPS).  
3. Cliente paga (Pix, cartão, etc.).  
4. Mercado Pago chama sua API: `POST /api/webhooks/mercadopago`.  
5. Seu sistema marca o pedido como **PAGO** e envia o email com o token.  
6. O cliente também pode ficar na página “Aguardando pagamento” e o front chama `POST /api/public/payment/sync` para atualizar o status (polling).

Se a **notification_url** não for enviada (por causa da URL base errada), o passo 4 nunca acontece e o pedido fica pendente mesmo com o pagamento aprovado no Mercado Pago.

---

## Depois do deploy

- Faça um **novo pedido de teste** (pode usar valor mínimo no Mercado Pago de teste).  
- Confirme que, após o pagamento, o pedido fica **PAGO** e o token/email são gerados.  
- Nos logs da Vercel (ou do servidor), verifique se aparece “Criando preferência com URLs” com `notificationSent: true` quando a base for HTTPS.
