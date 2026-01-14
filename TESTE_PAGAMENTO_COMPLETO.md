# 🧪 Guia de Teste Completo - Pagamento

## ✅ Checklist Antes de Testar

- [x] Token do Mercado Pago configurado no `.env`
- [x] Email configurado no `.env` (EMAIL_FROM e EMAIL_PASSWORD)
- [x] Servidor rodando
- [x] Banco de dados conectado

## 📋 Passo a Passo do Teste

### 1. Criar um Pedido

1. Acesse: `http://localhost:3000/comprar`
2. Preencha o formulário:
   - **Nome**: Seu nome completo
   - **Telefone**: (11) 99999-9999
   - **Email**: Use um email real que você tenha acesso (para receber o token)
3. Adicione itens:
   - Abadá (Tamanho Único já vem selecionado)
   - Quantidade: 1
4. Clique em **"Finalizar Compra"**

### 2. Pagar no Mercado Pago

Você será redirecionado para a página de pagamento do Mercado Pago.

**Use este cartão de teste:**

```
Número: 5031 4332 1540 6351
CVV: 123
Vencimento: 11/25
Nome: APRO
```

**Importante:** O nome deve ser exatamente **"APRO"** (em maiúsculas) para o pagamento ser aprovado automaticamente.

### 3. O Que Acontece Após o Pagamento

#### ✅ Se o pagamento for aprovado:

1. **Webhook será chamado** (se configurado)
   - O pedido será atualizado para status "PAGO"
   - Um token de troca será gerado
   - Um email será enviado com o token

2. **Email será enviado** (se configurado)
   - Verifique sua caixa de entrada
   - O email conterá:
     - Token de troca
     - Link para a página de troca
     - QR Code (na página)

3. **Pedido no banco de dados**
   - Status: `PAGO`
   - `exchangeToken`: gerado
   - `paidAt`: data/hora do pagamento

#### ❌ Se o pagamento for recusado:

Use o mesmo cartão, mas com nome **"OTHE"** (em maiúsculas) para testar recusa.

### 4. Verificar o Resultado

#### No Painel Admin:

1. Acesse: `http://localhost:3000/admin/pedidos`
2. Procure pelo pedido que você criou
3. Verifique:
   - Status: deve estar como "PAGO"
   - Token de troca: deve estar preenchido
   - Data de pagamento: deve estar preenchida

#### No Email:

1. Verifique sua caixa de entrada
2. Procure por email de: `blocovouali@gmail.com`
3. Assunto: "🎉 Pagamento Aprovado - Token de Troca | Bloco Vou Ali"
4. O email deve conter:
   - Token de troca
   - Link para a página de troca

#### Nos Logs do Servidor:

No terminal onde o servidor está rodando, você deve ver:

```
Pedido [ID] aprovado e token gerado
Email enviado para [email]
```

### 5. Testar a Página de Troca

1. Copie o token do email (ou do painel admin)
2. Acesse: `http://localhost:3000/troca/[TOKEN]`
   - Substitua `[TOKEN]` pelo token que você recebeu
3. Você deve ver:
   - Informações do pedido
   - QR Code para leitura
   - Itens do pedido

## 🔍 Verificações Importantes

### Webhook

**Nota:** Em desenvolvimento local (localhost), o webhook pode não ser chamado automaticamente pelo Mercado Pago porque:
- O webhook precisa de uma URL HTTPS pública
- Localhost não é acessível externamente

**Soluções:**
1. Use ngrok (veja `USAR_NGROK_PARA_TESTES.md`)
2. Ou teste manualmente aprovando o pagamento no painel do Mercado Pago

### Email

Se o email não foi enviado, verifique:

1. **Configuração no .env:**
   ```env
   EMAIL_FROM="blocovouali@gmail.com"
   EMAIL_PASSWORD="lqnqnxtwwghvpbhb"
   ```

2. **Logs do servidor:**
   - Procure por erros relacionados a email
   - Verifique se há mensagens de "Email enviado"

3. **Caixa de spam:**
   - O email pode ter ido para spam

## 🐛 Problemas Comuns

### Pagamento não atualiza no banco

- **Causa:** Webhook não foi chamado
- **Solução:** Use ngrok ou atualize manualmente no painel admin

### Email não foi enviado

- **Causa:** Configuração de email incorreta ou erro no envio
- **Solução:** Verifique os logs do servidor e a configuração do email

### Token não foi gerado

- **Causa:** Webhook não processou o pagamento
- **Solução:** Verifique os logs do servidor ou gere manualmente no painel admin

## ✅ Teste Completo Bem-Sucedido

Se tudo funcionou, você deve ter:

- ✅ Pedido criado
- ✅ Pagamento aprovado no Mercado Pago
- ✅ Pedido atualizado para "PAGO" no banco
- ✅ Token de troca gerado
- ✅ Email recebido com o token
- ✅ Página de troca funcionando com o token

## 🎉 Pronto!

Se todos os itens acima estão funcionando, seu sistema está completo e pronto para uso!
