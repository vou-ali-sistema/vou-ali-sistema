# Configuração de Email - Bloco Vou Ali

## 📧 Email do Sistema

O sistema usa o email **blocovouali@gmail.com** para enviar os tokens de troca aos clientes.

## ⚙️ Configuração

### Local (.env)

Adicione no `.env` ou `.env.local`:

```env
EMAIL_FROM="blocovouali@gmail.com"
EMAIL_PASSWORD="sua-senha-de-app-aqui"
```

### Produção (Vercel) — obrigatório para o email chegar

1. Vercel → seu projeto → **Settings** → **Environment Variables**
2. Adicione:
   - **EMAIL_FROM**: `blocovouali@gmail.com` (ou o email que envia)
   - **EMAIL_PASSWORD**: a **Senha de app** do Gmail (16 caracteres)
3. Marque o ambiente **Production** (e Preview se quiser).
4. Salve e faça **Redeploy** do projeto.

**Se EMAIL_PASSWORD não estiver configurado no Vercel, o email com o token não será enviado** (o pagamento é aprovado, mas o cliente não recebe o email).

### Como obter a senha de app do Gmail:

1. Acesse: https://myaccount.google.com/security
2. Ative a **Verificação em duas etapas** (obrigatório)
3. Vá em **Senhas de app** (ou acesse: https://myaccount.google.com/apppasswords)
4. Selecione **E-mail** e **Outro (personalizado)**
5. Digite "Bloco Vou Ali Sistema"
6. Clique em **Gerar**
7. Copie a senha gerada (16 caracteres sem espaços)
8. Use essa senha no `EMAIL_PASSWORD`

**⚠️ IMPORTANTE:** 
- Você DEVE usar uma "Senha de App" do Google, não sua senha normal
- A verificação em duas etapas precisa estar ativada

## 📨 Funcionamento

Quando um pagamento é aprovado pelo Mercado Pago:

1. O sistema gera automaticamente um token de troca
2. Um email é enviado para o cliente com:
   - Token de troca
   - Link para a página de troca com QR code
   - Instruções de uso

## 🔧 Teste

Para testar o envio de email, você pode:

1. Fazer uma compra de teste
2. Aprovar o pagamento no Mercado Pago
3. Verificar se o email foi recebido

## ❌ Problemas Comuns

### Email não está sendo enviado

1. **Produção (Vercel):** Confirme que `EMAIL_FROM` e `EMAIL_PASSWORD` estão em **Environment Variables** e que fez Redeploy depois de salvar.
2. Use **Senha de app** do Google (não a senha normal do Gmail).
3. Verifique os logs (Vercel → Deployments → Function logs) por erros como `[MP_WEBHOOK] Erro ao enviar email` ou `EMAIL_PASSWORD não configurado`.

### Erro de autenticação (Gmail)

- Use **Senha de app** do Google (não a senha normal da conta).
- Ative a **Verificação em duas etapas** na conta Google.
- Gere a senha de app em: https://myaccount.google.com/apppasswords (16 caracteres, sem espaços).
