# Mercado Pago: mapeamento do fluxo e diagnóstico (compras não registradas)

## Fluxo oficial (resumo)

```
Criar Preference
       ↓
Usuário paga
       ↓
Mercado Pago redireciona ou chama webhook
       ↓
Você recebe payment_id
       ↓
GET /v1/payments/{payment_id}
       ↓
Atualiza status no banco
```

| Etapa | Onde no código |
|-------|----------------|
| **Criar Preference** | `lib/mercado-pago.ts` → `criarPreferenciaPedido(orderId)`. Preferência com `external_reference = orderId`, `notification_url`, `back_urls`. |
| **Usuário paga** | Checkout do MP (link da preferência). |
| **Redireciona ou webhook** | **Webhook:** `POST /api/webhooks/mercadopago` (MP envia `data.id` = payment_id). **Redirect:** `back_urls` → `/troca/pendente?orderId=...` (MP pode enviar `payment_id`/`collection_id` na URL). |
| **Recebe payment_id** | Webhook: extraído de `body.data.id` / `body.resource` (só numérico); salvo em `order.mpPaymentId`. Redirect: URL pode trazer `payment_id` ou `collection_id`. **Não usar preference_id para sincronização.** |
| **GET /v1/payments/{payment_id}** | **Webhook e Sync:** apenas `GET https://api.mercadopago.com/v1/payments/{payment_id}` com header `Authorization: Bearer MERCADOPAGO_ACCESS_TOKEN`. O `payment_id` vem do body (redirect) ou de `order.mpPaymentId` (já salvo pelo webhook). |
| **Atualiza status no banco** | `app/api/webhooks/mercadopago/route.ts` e `app/api/public/payment/sync/route.ts` → `prisma.order.update` (PAGO, CANCELADO, **mpPaymentId**, exchangeToken, email). |

### Endpoint correto para buscar pagamento

```
GET https://api.mercadopago.com/v1/payments/{PAYMENT_ID}
```

Header: `Authorization: Bearer MERCADOPAGO_ACCESS_TOKEN`

- **PAYMENT_ID** = ID **numérico** retornado pelo Mercado Pago ao criar o pagamento (ex.: `{ "id": 13123456789, "status": "pending" }`). Esse `id` deve ser salvo no banco em `order.mpPaymentId`. Recebido no webhook (`data.id`) ou na URL de retorno (`payment_id` / `collection_id`).
- **Não** usar `preference_id` para consultar pagamento; usar somente `payment_id` (numérico).

---

## Onde cada coisa está no código

| O quê | Onde |
|------|------|
| **webhook_url (notification_url)** | `lib/mercado-pago.ts`: `notificationUrl = ${baseUrl}/api/webhooks/mercadopago`; enviada em `preferenceBody.notification_url` quando `isHttps` (linhas 72–74, 107–109). |
| **back_urls** | `lib/mercado-pago.ts`: `success`, `failure`, `pending` = `${baseUrl}/troca/pendente?orderId=${orderId}`; setados em `preferenceBody.back_urls` quando `!isLocalhost` (linhas 69–71, 114–118). |
| **external_reference** | `lib/mercado-pago.ts`: `preferenceBody.external_reference = order.externalReference \|\| orderId` (linha 88). O `orderId` do nosso banco é o mesmo que `order.externalReference` (setado antes em `app/api/orders/route.ts`). |
| **Route handler do webhook** | `app/api/webhooks/mercadopago/route.ts`: `POST` (e `GET` para ping). |
| **Atualização de status do pedido** | `app/api/webhooks/mercadopago/route.ts`: `prisma.order.update` com `status: 'PAGO'`, `paymentStatus: 'APPROVED'`, `paidAt`, `mpPaymentId`, `exchangeToken` (e equivalentes para CANCELADO/REFUNDED). |

## Fluxo resumido

1. **Criação do pedido e preferência** (`app/api/orders/route.ts`):
   - Cria pedido no banco (PENDENTE).
   - Atualiza `externalReference = order.id`.
   - Chama `criarPreferenciaPedido(order.id)` em `lib/mercado-pago.ts`.
   - Na preferência: `external_reference = order.id`, `notification_url` (se HTTPS), `back_urls` (se não localhost).
   - Salva `mpPreferenceId` e `paymentLink` no pedido.
   - Log: `[MP] Preferência criada: { orderId, preferenceId, init_point }`.

2. **Webhook** (`app/api/webhooks/mercadopago/route.ts`):
   - Recebe POST com body JSON (ex.: `type: "payment"`, `data.id` = id do pagamento).
   - Log: headers (`x-signature`, `x-request-id`), query, body.
   - Extrai `paymentId` (body ou query `data.id`).
   - Responde 200 rápido.
   - Busca pagamento na API do MP (`GET /v1/payments/{id}`).
   - Usa `payment.external_reference` = nosso `orderId`.
   - Busca pedido por `id = externalReference` e atualiza status (PAGO/CANCELADO/REFUNDED).

3. **Retorno (redirect)** (`app/troca/pendente/page.tsx`):
   - URL: `/troca/pendente?orderId=...` (vem das `back_urls`).
   - Página busca pedido **só por `orderId`** (não depende de `payment_id`/`preference_id` do MP para mostrar status).
   - `PendenteClient` faz polling em `/api/public/payment/sync` com `orderId`/`paymentId`/`preferenceId` para atualizar UI.

## Possíveis causas de “sistema não registra compras”

1. **Webhook não chega**
   - `notification_url` não é enviada: em produção, `APP_BASE_URL` ou `NEXTAUTH_URL` deve ser **HTTPS**. Se for `http://` ou vazio (fallback localhost), `notification_url` não é setada.
   - URL do webhook inacessível (firewall, domínio errado, SSL).
   - **Pagamentos de teste**: a documentação do MP diz que *“Os pagamentos de teste, criados com credenciais de teste, não enviarão notificações”* quando a URL é só na criação do pagamento. Para teste, é preciso configurar Webhooks em **Suas integrações** (painel do desenvolvedor) com a URL de teste.

2. **Rota do webhook errada**
   - Rota esperada: `POST https://<seu-dominio>/api/webhooks/mercadopago`. Conferir no log `[MP] Criando preferência` o valor de `notification`.

3. **external_reference ausente ou diferente**
   - O pedido é criado com `externalReference = order.id` antes de criar a preferência; a preferência usa `order.externalReference || orderId`. Se o MP não devolver esse mesmo valor em `payment.external_reference`, o webhook não acha o pedido (log: `[Webhook MP] Pedido não encontrado`).

4. **preferenceId não salvo**
   - Hoje salvamos `mpPreferenceId` e `paymentLink` após criar a preferência. Se esse update falhar, o pedido continua válido; o crítico para “registrar compra” é o webhook atualizar o status.

5. **Prisma/banco falhando**
   - Se `prisma.order.update` ou `findUnique` falhar no webhook, o log `[Webhook MP] Erro ao processar` aparece. Verificar logs da Vercel e conexão com o banco.

6. **Resposta 200 lenta**
   - O MP espera resposta em até ~22s. O handler agora responde 200 rápido e envia email em background; a atualização do pedido é feita antes do 200.

## O que foi alterado (checklist)

- **Endpoint que cria a preferência** (`app/api/orders/route.ts`):
  - Pedido criado no banco antes do redirect (já era).
  - `externalReference` setado antes de chamar `criarPreferenciaPedido` (já era).
  - `preferenceId` e `paymentLink` salvos no pedido (já era).
  - Log explícito: `orderId`, `preferenceId`, `init_point`.

- **lib/mercado-pago.ts**:
  - Log inclui `orderId`.
  - `external_reference`, `notification_url` (se HTTPS), `back_urls` (se não localhost) já estavam corretos.

- **Webhook** (`app/api/webhooks/mercadopago/route.ts`):
  - Log de headers (`x-signature`, `x-request-id`), query e body.
  - Resposta 200 imediata; processamento (buscar pagamento, atualizar pedido) antes do return; email em fire-and-forget.
  - Extração de `paymentId` de `body.data.id` (como string), `body.resource`, `body.id`, e query `data.id`.
  - Logs com prefixo `[Webhook MP]` em cada passo (recebido, sem paymentId, sem external_reference, pedido não encontrado, pedido atualizado PAGO/CANCELADO/REFUNDED, erro).
  - Handler `GET` para ping (retorna 200 e loga query).

- **Retorno** (`app/troca/pendente`):
  - Já usa `orderId` na URL e busca pedido por ele; sem mudanças.

## Arquivos alterados

- `app/api/orders/route.ts` – logs e uso explícito de `preferenceId`/`init_point`.
- `lib/mercado-pago.ts` – log com `orderId`.
- `app/api/webhooks/mercadopago/route.ts` – logs, 200 rápido, extração robusta de `paymentId`, GET, email em background.
- `MERCADOPAGO_FLUXO_E_DIAGNOSTICO.md` – este arquivo (mapeamento + diagnóstico).

Nenhuma rota ou URL pública foi alterada.
