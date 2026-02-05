# Por que o Mercado Pago “funcionava antes e agora não” + o que foi feito

## 1) Onde a CSP está definida

- **No repositório**: a CSP é definida **apenas em `next.config.js`**, na função `async headers()`. Não há CSP em `middleware.ts`, em layouts nem em meta tags.
- **Fora do repositório**: a mensagem do console (`script-src 'nonce-...' 'strict-dynamic'`) **não aparece em nenhum arquivo nem no histórico do Git**. Ou seja, a CSP com **nonce** e **strict-dynamic** **não foi introduzida por commit/arquivo deste projeto**; ela vem de fora, em geral do **hosting (ex.: Vercel)**.

### Onde pode estar a CSP que bloqueia

1. **Vercel – Security Headers**  
   No painel do projeto: **Settings → Security → Security Headers**. Se existir uma política com `Content-Security-Policy` usando `nonce` e `strict-dynamic`, ela pode ser aplicada (sozinha ou junto com a do Next.js) e bloquear scripts do Mercado Pago.

2. **Vercel – Edge / Firewall**  
   Algumas configurações de Edge ou Firewall podem injetar headers de segurança.

3. **Next.js em runtime**  
   Em versões recentes, o Next pode definir headers em certas condições; mesmo assim, no código deste projeto não há uso de nonce/strict-dynamic.

Conclusão: **a origem da CSP que bloqueia é externa ao código (em especial Vercel).** O que fazemos no repo é definir uma CSP explícita em `next.config.js` para tentar sobrescrever ou conviver com a do hosting.

---

## 2) O que o Git mostra (quem introduziu nonce/strict-dynamic)

- Foi feita busca no histórico por `nonce`, `strict-dynamic` e `Content-Security-Policy` em `*.js`, `*.ts`, `*.tsx`.
- **Nenhum commit deste repositório introduziu nonce ou strict-dynamic.**  
  O `next.config.js` no último commit (`b9805f4`) **não tinha** a função `headers()` nem CSP; a CSP com nonce/strict-dynamic vem de **fora do repositório** (ex.: configuração do Vercel ou outra camada de hosting).

Por isso: **“antes funcionava e agora não”** tende a ser por alguma mudança no **ambiente (ex.: ativação de Security Headers no Vercel, mudança de plano, ou atualização que passou a injetar CSP)** e não por um commit específico deste projeto.

---

## 3) O que foi aplicado no código

### CSP só nas rotas de checkout

- Em **`next.config.js`** a CSP mais permissiva (que permite Mercado Pago) foi aplicada **somente** nas rotas:
  - `/checkout`, `/checkout/*`
  - `/review`, `/review/*`
  - `/redirect`, `/redirect/*`
- Nessas rotas a política permite scripts/frames do MP (sem depender de nonce/strict-dynamic). No restante do site continua uma CSP forte.

Se a CSP bloqueadora vier do Vercel, pode ser necessário **ajustar ou desativar** a política com nonce/strict-dynamic no painel do Vercel para essas rotas ou para o projeto, e deixar a CSP do `next.config.js` prevalecer.

### Produção: init_point e token

- Em **`lib/mercado-pago.ts`**:
  - Em produção (Vercel) já se usa **só `init_point`**; se a API devolver apenas `sandbox_init_point`, o código **lança erro** e não usa sandbox.
  - Foi reforçada a validação de **token vazio**: no início de `criarPreferenciaPedido` exige-se `MERCADOPAGO_ACCESS_TOKEN`; se estiver vazio, falha antes de chamar a API, evitando cair em sandbox por token ausente.

---

## 4) Arquivos alterados (resumo)

| Arquivo | Alteração |
|--------|------------|
| **`next.config.js`** | CSP permissiva **apenas** em `/checkout`, `/review`, `/redirect` (e subrotas). Removidas `/comprar` e `/troca/pendente` da lista de rotas com CSP permissiva. |
| **`lib/mercado-pago.ts`** | Validação de token no início (evitar sandbox por token vazio); uso consistente de `init_point` em produção; variáveis de ambiente unificadas (`token`, `isProd`). |
| **`CSP_MERCADOPAGO.md`** | Atualizado para refletir que a CSP permissiva vale só para `/checkout`, `/review`, `/redirect`. |
| **`CSP_ANTES_FUNCIONAVA_AGORA_NAO.md`** | Este arquivo: onde a CSP está, por que “antes funcionava e agora não” e o que foi feito. |

---

## 5) Próximos passos (se ainda bloquear)

1. **Vercel**  
   Em **Settings → Security → Security Headers**, verificar se há `Content-Security-Policy` com nonce/strict-dynamic. Se houver, desativar ou relaxar para as rotas de checkout (ou para o domínio) para que a CSP do `next.config.js` tenha efeito.

2. **Confirmar rota do checkout**  
   Se o fluxo de pagamento passar por outras URLs (ex.: `/comprar` ou `/troca/pendente`), e você quiser CSP permissiva nelas também, é preciso voltar a incluí-las nas regras de `headers()` no `next.config.js`.

3. **Token de produção**  
   Em produção, garantir que `MERCADOPAGO_ACCESS_TOKEN` no Vercel está preenchido com o **Access Token de produção** do app no Mercado Pago, para sempre receber `init_point` e não sandbox.
