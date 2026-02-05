# Aviso: Erro de Favicon no Console

## Erro exibido

```
GET https://www.mercadopago.com.br/favicon.ico 400 (Bad Request)
```

## Conclusão da análise

**Este erro NÃO é causado pelo projeto Bloco Vou Ali e NÃO afeta o fluxo de pagamento.**

### Por que aparece?

- O erro surge quando o usuário está **na página de checkout do Mercado Pago** (mercadopago.com.br).
- Nessa tela, o navegador tenta carregar automaticamente o favicon do domínio atual.
- O servidor do Mercado Pago está retornando 400 para o próprio favicon deles.
- É um problema interno do Mercado Pago, não do nosso sistema.

### O que foi verificado no projeto

1. **Nenhuma referência ao favicon do Mercado Pago** – O código não aponta para mercadopago.com.br/favicon.ico.
2. **Uso de favicon local** – A aplicação usa favicon próprio:
   - `public/favicon.ico`
   - `app/icon.ico`
   - `layout.tsx`: `icons: { icon: '/favicon.ico' }` (caminho relativo ao nosso domínio)
3. **Integração de pagamento** – Nenhuma alteração necessária; o fluxo de checkout está correto.

### Resultado esperado

- O pagamento segue funcionando normalmente.
- O erro no console é apenas informativo e pode ser ignorado.
- Não é indicado tentar corrigir isso no código de pagamento.
- A aplicação utiliza apenas favicon local; não há referências externas ao favicon do Mercado Pago.
