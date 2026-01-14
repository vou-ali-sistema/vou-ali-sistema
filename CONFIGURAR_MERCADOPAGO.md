# Configuração do Mercado Pago - Bloco Vou Ali

## 📋 Pré-requisitos

1. Ter uma conta no Mercado Pago (pode ser conta de teste)
2. Acessar: https://www.mercadopago.com.br/developers/panel

## 🔑 Como obter o Access Token

### Para Testes (Sandbox):

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Faça login na sua conta Mercado Pago
3. Crie uma nova aplicação ou selecione uma existente
4. Vá na aba **"Credenciais de teste"**
5. Copie o **"Token de acesso"** (Access Token)
6. Cole no arquivo `.env` como `MERCADOPAGO_ACCESS_TOKEN`

### Para Produção:

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá na aba **"Credenciais de produção"**
4. Copie o **"Token de acesso"** (Access Token)
5. Cole no arquivo `.env` como `MERCADOPAGO_ACCESS_TOKEN`

## ⚙️ Configuração no .env

Adicione ou atualize no arquivo `.env`:

```env
MERCADOPAGO_ACCESS_TOKEN="seu-token-aqui"
MERCADOPAGO_WEBHOOK_SECRET="seu-webhook-secret-aqui"
```

**Nota:** O `MERCADOPAGO_WEBHOOK_SECRET` é opcional, mas recomendado para produção.

## 🔗 Configurar Webhook (Opcional mas Recomendado)

O webhook permite que o Mercado Pago notifique automaticamente quando um pagamento for aprovado.

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **"Webhooks"**
4. Adicione a URL: `https://seu-dominio.com/api/webhooks/mercadopago`
5. Copie o **"Secret"** gerado
6. Cole no arquivo `.env` como `MERCADOPAGO_WEBHOOK_SECRET`

**Para desenvolvimento local:**
- Use uma ferramenta como ngrok para expor sua aplicação local
- Ou teste manualmente aprovando pagamentos no painel do Mercado Pago

## ✅ Testar a Configuração

1. Configure o token no `.env`
2. Reinicie o servidor
3. Tente criar um pedido na página `/comprar`
4. Você deve ser redirecionado para o checkout do Mercado Pago

## 🧪 Contas de Teste

Para testar pagamentos, use as contas de teste do Mercado Pago:

**Comprador de teste:**
- Email: `test_user_123456789@testuser.com`
- Senha: (gerada automaticamente no painel)

**Vendedor de teste:**
- Use suas credenciais de teste do painel

## ❌ Problemas Comuns

### Erro: "Invalid access_token"

- Verifique se o token está correto no `.env`
- Certifique-se de que não há espaços extras
- Verifique se está usando o token correto (teste vs produção)

### Erro: "Webhook não recebido"

- Verifique se a URL do webhook está correta
- Para desenvolvimento local, use ngrok
- Verifique os logs do servidor

### Link de pagamento não é gerado

- Verifique se `MERCADOPAGO_ACCESS_TOKEN` está configurado
- Verifique os logs do servidor para erros
- Certifique-se de que o servidor foi reiniciado após adicionar o token

## 📚 Documentação Oficial

- API do Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs
- Preferências de Pagamento: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/checkout-customization/preferences
