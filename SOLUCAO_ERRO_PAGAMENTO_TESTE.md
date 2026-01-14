# 🔧 Solução: Erro "Uma das partes é de teste"

## ❌ Erro

```
Ocorreu um erro...
Uma das partes com as quais você está tentando efetuar o pagamento é de teste.
```

## 🔍 Causa

Este erro acontece quando você está usando um **token de teste** do Mercado Pago, mas está tentando fazer o pagamento com uma **conta real** do Mercado Pago (não uma conta de teste).

## ✅ Solução

### Opção 1: Usar Conta de Teste do Mercado Pago (Recomendado)

Para testar pagamentos com token de teste, você precisa usar uma **conta de teste** do Mercado Pago:

1. **Criar uma conta de teste:**
   - Acesse: https://www.mercadopago.com.br/developers/panel/test-users
   - Clique em "Criar usuário de teste"
   - Escolha o país: Brasil
   - Escolha o tipo: Vendedor
   - Clique em "Criar"

2. **Fazer login com a conta de teste:**
   - Use o email e senha gerados
   - Ou faça login no checkout do Mercado Pago usando essa conta

3. **Usar o cartão de teste:**
   - Número: `5031 4332 1540 6351`
   - CVV: `123`
   - Vencimento: `11/25`
   - Nome: `APRO` (para aprovar) ou `OTHE` (para recusar)

### Opção 2: Usar Token de Produção (Não Recomendado para Testes)

Se você quiser usar sua conta real do Mercado Pago:

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá na aba **"Credenciais de produção"**
3. Copie o **"Token de acesso"** (Access Token de produção)
4. Atualize no `.env`:
   ```env
   MERCADOPAGO_ACCESS_TOKEN="seu-token-de-producao-aqui"
   ```
5. Reinicie o servidor

**⚠️ ATENÇÃO:** Com token de produção, você estará fazendo pagamentos REAIS! Use apenas quando estiver pronto para vender de verdade.

### Opção 3: Testar sem Pagamento Real

Você pode testar o sistema sem fazer o pagamento completo:

1. Crie o pedido normalmente
2. Quando chegar na página de pagamento, **não complete o pagamento**
3. Volte ao painel admin
4. Atualize manualmente o pedido para status "PAGO"
5. Gere o token de troca manualmente

## 🎯 Solução Recomendada

**Use a Opção 1** - Criar uma conta de teste do Mercado Pago. É a forma mais segura e recomendada para testar o sistema sem riscos.

## 📝 Passo a Passo Detalhado

### 1. Criar Usuário de Teste

1. Acesse: https://www.mercadopago.com.br/developers/panel/test-users
2. Clique em **"Criar usuário de teste"**
3. Preencha:
   - **País**: Brasil
   - **Tipo**: Vendedor (ou Comprador, se quiser testar do lado do cliente)
4. Clique em **"Criar"**
5. **Anote o email e senha** gerados

### 2. Fazer Login no Checkout

Quando você for redirecionado para o checkout do Mercado Pago:

1. **Não use sua conta real**
2. Clique em **"Fazer login"** ou **"Entrar"**
3. Use o **email e senha da conta de teste** que você criou
4. Complete o pagamento com o cartão de teste

### 3. Usar Cartão de Teste

```
Número: 5031 4332 1540 6351
CVV: 123
Vencimento: 11/25
Nome: APRO (para aprovar automaticamente)
```

## ✅ Verificação

Após seguir esses passos, o pagamento deve funcionar corretamente!

## 🆘 Ainda com Problemas?

Se ainda estiver dando erro:

1. Verifique se está usando o **token de teste** correto
2. Certifique-se de estar fazendo login com a **conta de teste**
3. Verifique se o cartão de teste está correto
4. Tente criar um novo usuário de teste
