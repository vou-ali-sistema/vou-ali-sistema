# 🚀 Configuração para Produção - Pagamentos Reais

## ⚠️ ATENÇÃO IMPORTANTE

Ao configurar para produção, você estará processando **PAGAMENTOS REAIS**. Certifique-se de que:

- ✅ O sistema está funcionando corretamente
- ✅ Você testou tudo em ambiente de teste
- ✅ Você tem uma conta do Mercado Pago verificada
- ✅ Você entende como funciona o sistema de comissões do Mercado Pago

## 📋 Passo a Passo

### 1. Obter Token de Produção

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Faça login com sua conta do Mercado Pago
3. Selecione sua aplicação (ou crie uma nova)
4. Vá na aba **"Credenciais de produção"** (não "Credenciais de teste")
5. Copie o **"Token de acesso"** (Access Token de produção)

### 2. Configurar no .env

1. Abra o arquivo `.env`
2. Localize a linha:
   ```env
   MERCADOPAGO_ACCESS_TOKEN="APP_USR-1812576772922459-011412-..."
   ```
3. Substitua pelo token de produção:
   ```env
   MERCADOPAGO_ACCESS_TOKEN="seu-token-de-producao-aqui"
   ```
4. **IMPORTANTE:** Certifique-se de que é o token de PRODUÇÃO, não de teste!

### 3. Configurar URLs de Produção

Atualize as URLs no `.env` para seu domínio real:

```env
NEXTAUTH_URL="https://seu-dominio.com"
APP_BASE_URL="https://seu-dominio.com"
```

**Exemplo:**
```env
NEXTAUTH_URL="https://blocovouali.com.br"
APP_BASE_URL="https://blocovouali.com.br"
```

### 4. Configurar Webhook (Opcional mas Recomendado)

O webhook permite que o Mercado Pago notifique automaticamente quando um pagamento for aprovado.

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **"Webhooks"**
4. Clique em **"Adicionar webhook"**
5. Adicione a URL: `https://seu-dominio.com/api/webhooks/mercadopago`
6. Copie o **"Secret"** gerado
7. Adicione no `.env`:
   ```env
   MERCADOPAGO_WEBHOOK_SECRET="seu-webhook-secret-aqui"
   ```

### 5. Reiniciar o Servidor

Após fazer todas as alterações:

1. Pare o servidor (Ctrl+C)
2. Reinicie: `npm run dev` ou `INICIAR_SISTEMA.bat`

## 💰 Como Funciona o Pagamento

### Comissões do Mercado Pago

O Mercado Pago cobra uma comissão sobre cada pagamento:

- **Cartão de crédito**: ~4,99% + R$ 0,40 por transação
- **PIX**: ~0,99% por transação
- **Boleto**: ~R$ 3,49 por transação

**Exemplo:**
- Venda de R$ 100,00 no cartão
- Comissão: R$ 4,99 + R$ 0,40 = R$ 5,39
- Você recebe: R$ 94,61

### Prazo de Recebimento

- **Cartão de crédito**: 14 dias (ou menos, dependendo do plano)
- **PIX**: Imediato
- **Boleto**: 2 dias úteis após o pagamento

### Valores em Centavos

O sistema trabalha com valores em centavos para evitar problemas de arredondamento:

- R$ 100,00 = 10000 centavos
- R$ 50,50 = 5050 centavos
- R$ 1,99 = 199 centavos

## 🔒 Segurança

### Checklist de Segurança

- [ ] Use HTTPS (obrigatório para produção)
- [ ] Configure variáveis de ambiente corretamente
- [ ] Não compartilhe seu token de produção
- [ ] Mantenha o `.env` fora do controle de versão (já está no .gitignore)
- [ ] Configure o webhook para receber notificações
- [ ] Monitore os pagamentos no painel do Mercado Pago

### Variáveis Sensíveis

Nunca compartilhe ou exponha:

- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `EMAIL_PASSWORD`

## 📊 Monitoramento

### Painel do Mercado Pago

Acesse regularmente:
- https://www.mercadopago.com.br/activities
- Para ver todos os pagamentos recebidos

### Painel Admin do Sistema

Acesse:
- `https://seu-dominio.com/admin/pedidos`
- Para ver todos os pedidos e seus status

## ✅ Teste em Produção

Antes de começar a vender:

1. Faça um pedido de teste com valor baixo (ex: R$ 1,00)
2. Complete o pagamento
3. Verifique se:
   - O pedido foi atualizado no banco
   - O email foi enviado
   - O token de troca foi gerado
   - O pagamento aparece no painel do Mercado Pago

## 🆘 Problemas Comuns

### Pagamento não aparece no painel

- Verifique se está usando o token de produção correto
- Verifique se o pagamento foi realmente aprovado
- Aguarde alguns minutos (pode haver delay)

### Email não é enviado

- Verifique a configuração de email no `.env`
- Verifique os logs do servidor
- Verifique a caixa de spam

### Webhook não funciona

- Verifique se a URL está correta
- Verifique se o servidor está acessível publicamente
- Verifique os logs do servidor

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs do servidor
2. Verifique o painel do Mercado Pago
3. Consulte a documentação: https://www.mercadopago.com.br/developers/pt/docs
