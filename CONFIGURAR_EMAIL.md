# Configuração de Email - Bloco Vou Ali

## 📧 Email do Sistema

O sistema usa o email **blocovouali@gmail.com** para enviar os tokens de troca aos clientes.

## ⚙️ Configuração no .env

Adicione as seguintes variáveis no arquivo `.env`:

```env
EMAIL_FROM="blocovouali@gmail.com"
EMAIL_PASSWORD="sua-senha-de-app-aqui"
```

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

1. Verifique se `EMAIL_FROM` e `EMAIL_PASSWORD` estão configurados no `.env`
2. Verifique se está usando uma "Senha de App" do Microsoft
3. Verifique os logs do servidor para erros

### Erro de autenticação

- Certifique-se de usar uma "Senha de App" e não a senha normal
- Verifique se a verificação em duas etapas está ativada
- Verifique se o email está correto: `blocovouali@gmail.com`
- Certifique-se de que a senha de app foi gerada corretamente (16 caracteres)
