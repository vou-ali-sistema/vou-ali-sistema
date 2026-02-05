# CSP e Mercado Pago

## Onde a CSP está definida

A **Content-Security-Policy** é definida em **`next.config.js`**, na função `async headers()`. Não há CSP em `middleware.ts` nem em meta tags nos layouts.

## Comportamento

- **CSP permissiva (só rotas de checkout)** – aplicada **somente** em:
  - `/checkout`, `/checkout/*`
  - `/review`, `/review/*`
  - `/redirect`, `/redirect/*`

- **Restante do site**: CSP forte (sem `strict-dynamic`/nonce que bloqueiam scripts do MP).

Quando duas regras batem no mesmo path, a que vem **depois** no array de `headers()` prevalece; por isso as rotas de checkout sobrescrevem a CSP global.

---

## CSP nas rotas de checkout (Mercado Pago)

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.mercadopago.com https://*.mercadopago.com.br https://sdk.mercadopago.com https://www.mercadopago.com https://www.mercadopago.com.br;
frame-src 'self' https://*.mercadopago.com.br https://*.mercadopago.com https://www.mercadopago.com.br https://www.mercadopago.com;
connect-src 'self' https://*.mercadopago.com https://*.mercadopago.com.br https://api.mercadopago.com https://sandbox.mercadopago.com.br https://sandbox.mercadopago.com;
img-src 'self' data: blob: https:;
style-src 'self' 'unsafe-inline' https://*.mercadopago.com https://*.mercadopago.com.br;
font-src 'self' data:;
object-src 'none'; base-uri 'self'; form-action 'self';
```

- **script-src**: permite scripts do próprio site e do Mercado Pago (incl. inline/eval necessários ao checkout), **sem** `strict-dynamic`/nonce.
- **frame-src**: permite iframes do MP (.com e .com.br).
- **connect-src**: permite chamadas à API do MP e sandbox.
- **img-src** / **style-src**: compatíveis com recursos do MP e sandbox.

---

## CSP no restante do site

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self';
frame-src 'self';
object-src 'none'; base-uri 'self'; form-action 'self';
```

Sem `strict-dynamic` nem nonce, para evitar bloqueio de scripts do MP caso alguma página carregue recurso do MP fora das rotas de checkout.

---

## Arquivo alterado

- **`next.config.js`**: adicionadas as constantes `cspCheckout` e `cspStrict` e a função `async headers()` com as regras acima.

Nenhuma alteração em lógica de pagamento, rotas de API ou middleware além da definição de headers.
