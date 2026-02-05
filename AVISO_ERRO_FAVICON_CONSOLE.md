# Aviso: Erros no Console durante o Checkout do Mercado Pago

## Erros que podem aparecer

1. **Favicon 400/404**  
   `GET https://www.mercadopago.com.br/favicon.ico` ou `https://sandbox.mercadopago.com.br/favicon.ico 404`

2. **Content Security Policy (CSP)**  
   `Executing inline script violates the following Content Security Policy directive 'script-src 'nonce-...' 'strict-dynamic' ...'`  
   (em URL como `redirect?preference-id=...`)

3. **404 em URLs do Mercado Pago**  
   `GET https://sandbox.mercadopago.com.br/jms/lgz/background/session/... 404 (Not Found)`

## Conclusão da análise

**Nenhum desses erros é causado pelo projeto Bloco Vou Ali. Todos ocorrem nas páginas do próprio Mercado Pago (ou sandbox) e, em geral, não impedem o pagamento.**

### Onde acontecem

- Os erros aparecem enquanto o usuário está **na página de checkout/redirect do Mercado Pago** (mercadopago.com.br ou sandbox.mercadopago.com.br).
- A **CSP com nonce** é definida **pela página do Mercado Pago**, não pelo nosso app (não configuramos CSP no projeto).
- Os **404** (favicon e `/jms/lgz/...`) são requisições do domínio do MP; o nosso código não chama essas URLs.

### O que foi verificado no projeto

1. **CSP** – Não há `Content-Security-Policy` nem `nonce` em middleware, `next.config.js` ou layout.
2. **Favicon** – O app usa apenas favicon local (`/favicon.ico`, `app/icon.ico`, `layout.tsx`).
3. **Integração de pagamento** – O fluxo apenas redireciona para o link do MP; não embutimos checkout em iframe nem scripts do MP no nosso domínio.

### Resultado esperado

- O pagamento pode ser concluído normalmente; o redirect de volta para `/troca/pendente` deve funcionar.
- Os avisos no console vêm do **site do Mercado Pago** e podem ser ignorados.
- Não é possível corrigir esses erros no nosso código; eles são do lado do Mercado Pago (e no sandbox são comuns).

### Se o pagamento realmente travar

- Confirme se o bloqueio ocorre **na tela do MP** (antes de voltar para o nosso site) ou **na nossa página** `/troca/pendente`.
- Se for na tela do MP: use outro navegador ou desative extensões; em último caso, reporte ao suporte do Mercado Pago.
- Se for na nossa página: aí podemos checar redirecionamento e parâmetros da URL.
