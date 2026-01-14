# ⚡ Configuração Rápida - Mercado Pago Produção

## 🎯 Passo a Passo Rápido

### 1️⃣ Obter Token de Produção

1. **Acesse:** https://www.mercadopago.com.br/developers/panel/app
2. **Faça login** com sua conta do Mercado Pago
3. **Selecione sua aplicação** (ou crie uma nova se necessário)
4. **Clique na aba "Credenciais de produção"** ⚠️ (NÃO "Credenciais de teste")
5. **Copie o "Token de acesso"** (Access Token)

### 2️⃣ Configurar no Sistema

**Opção A - Script Automático:**
```bash
configurar-producao.bat
```

**Opção B - Manual:**
1. Abra o arquivo `.env`
2. Substitua o token:
   ```env
   MERCADOPAGO_ACCESS_TOKEN="seu-token-de-producao-aqui"
   ```
3. Atualize as URLs (se tiver domínio):
   ```env
   NEXTAUTH_URL="https://seu-dominio.com"
   APP_BASE_URL="https://seu-dominio.com"
   ```

### 3️⃣ Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C)
# Depois execute:
INICIAR_SISTEMA.bat
```

## ⚠️ IMPORTANTE

- **Token de PRODUÇÃO** = Pagamentos REAIS (você recebe dinheiro de verdade)
- **Token de TESTE** = Apenas para testes (não processa pagamentos reais)

## 💰 Comissões

- **Cartão:** ~4,99% + R$ 0,40
- **PIX:** ~0,99%
- **Boleto:** ~R$ 3,49

## ✅ Pronto!

Após configurar, você estará recebendo pagamentos reais!
