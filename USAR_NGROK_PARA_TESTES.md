# Usar ngrok para Testes Locais com Mercado Pago

## ⚠️ Problema

O Mercado Pago **não aceita mais URLs HTTP** (apenas HTTPS). Para testar localmente, você precisa usar uma ferramenta como **ngrok** que cria um túnel HTTPS para seu servidor local.

## 🚀 Solução Rápida: ngrok

### Passo 1: Instalar ngrok

1. Acesse: https://ngrok.com/download
2. Baixe o ngrok para Windows
3. Extraia o arquivo `ngrok.exe` em uma pasta (ex: `C:\ngrok\`)

### Passo 2: Iniciar o Servidor Local

1. Inicie seu servidor Next.js:
   ```bash
   npm run dev
   ```
   Ou execute: `INICIAR_SISTEMA.bat`

2. Certifique-se de que está rodando em: `http://localhost:3000`

### Passo 3: Iniciar o ngrok

1. Abra um novo terminal/PowerShell
2. Execute:
   ```bash
   ngrok http 3000
   ```

3. Você verá algo como:
   ```
   Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
   ```

4. **Copie a URL HTTPS** (ex: `https://abc123.ngrok-free.app`)

### Passo 4: Atualizar o .env

1. Abra o arquivo `.env`
2. Atualize as URLs:
   ```env
   NEXTAUTH_URL="https://abc123.ngrok-free.app"
   APP_BASE_URL="https://abc123.ngrok-free.app"
   ```

3. **IMPORTANTE**: Substitua `abc123.ngrok-free.app` pela URL que o ngrok gerou para você!

### Passo 5: Reiniciar o Servidor

1. Pare o servidor (Ctrl+C)
2. Inicie novamente: `npm run dev` ou `INICIAR_SISTEMA.bat`

### Passo 6: Testar

1. Acesse: `https://abc123.ngrok-free.app/comprar` (use a URL do ngrok)
2. Crie um pedido
3. Agora deve funcionar! 🎉

## 📝 Nota Importante

- A URL do ngrok **muda toda vez** que você reinicia o ngrok (na versão gratuita)
- Se reiniciar o ngrok, atualize o `.env` com a nova URL
- Para produção, use um domínio real com HTTPS

## 🔄 Alternativa: Versão Paga do ngrok

Com a versão paga, você pode ter uma URL fixa que não muda.

## ✅ Solução Atual no Código

O código foi ajustado para funcionar mesmo sem HTTPS em desenvolvimento, mas **sem redirecionamento automático** após o pagamento. O link de pagamento ainda funcionará, mas o cliente precisará voltar manualmente ao site após pagar.

Para uma experiência completa, use ngrok ou teste em produção.
