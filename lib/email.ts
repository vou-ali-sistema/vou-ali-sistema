import 'server-only'
import nodemailer from 'nodemailer'

interface SendTokenEmailParams {
  to: string
  customerName: string
  token: string
  orderId: string
  mpPaymentId?: string | null
}

export async function sendTokenEmail({ to, customerName, token, orderId, mpPaymentId }: SendTokenEmailParams) {
  const emailFrom = process.env.EMAIL_FROM || 'blocovouali@gmail.com'
  const emailPassword = process.env.EMAIL_PASSWORD || ''
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_BASE_URL || 'http://localhost:3000'
  const trocaUrl = `${baseUrl}/troca/${token}`

  if (!emailPassword) {
    return { success: false, errorMessage: 'EMAIL_PASSWORD não configurado no servidor.' }
  }

  // Configurar transporter para Gmail
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: emailFrom,
      pass: emailPassword,
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Token de Troca - Bloco Vou Ali</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #1e3a8a, #059669); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #facc15; margin: 0; font-size: 24px;">BLOCO</h1>
        <h2 style="color: white; margin: 5px 0; font-size: 32px;">VOU ALI</h2>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border: 2px solid #059669; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Olá, ${customerName}!</h2>
        
        <p>Seu pagamento foi aprovado com sucesso! 🎉</p>
        
        <p>Seu token de troca está pronto. Use-o para retirar seus itens:</p>
        
        <div style="background: white; padding: 20px; border: 2px solid #059669; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e3a8a;">Token de Troca:</p>
          <p style="margin: 0; font-family: monospace; font-size: 18px; color: #059669; word-break: break-all;">${token}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trocaUrl}" 
             style="display: inline-block; background: linear-gradient(to right, #059669, #1e3a8a); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Acessar Página de Troca
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Ou copie e cole este link no seu navegador:<br>
          <a href="${trocaUrl}" style="color: #059669; word-break: break-all;">${trocaUrl}</a>
        </p>
        
        <div style="background: #fef3c7; border: 2px solid #facc15; border-radius: 8px; padding: 15px; margin-top: 20px;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>⚠️ Importante:</strong> Guarde este email com segurança. Você precisará do token para retirar seus itens.
          </p>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
          Pedido: ${orderId}<br>
          ${mpPaymentId ? `Pagamento (Mercado Pago): ${mpPaymentId}<br>` : ''}
          Bloco Vou Ali - Sistema de Vendas
        </p>
      </div>
    </body>
    </html>
  `

  const textContent = `
BLOCO VOU ALI

Olá, ${customerName}!

Seu pagamento foi aprovado com sucesso!

Seu token de troca está pronto. Use-o para retirar seus itens:

Token: ${token}

Acesse: ${trocaUrl}

Ou copie e cole o link acima no seu navegador.

IMPORTANTE: Guarde este email com segurança. Você precisará do token para retirar seus itens.

Pedido: ${orderId}
${mpPaymentId ? `Pagamento (Mercado Pago): ${mpPaymentId}\n` : ''}
Bloco Vou Ali - Sistema de Vendas
  `

  try {
    const info = await transporter.sendMail({
      from: `"Bloco Vou Ali" <${emailFrom}>`,
      to: to,
      subject: '🎉 Pagamento Aprovado - Token de Troca | Bloco Vou Ali',
      text: textContent,
      html: htmlContent,
    })

    console.log('Email enviado:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, errorMessage }
  }
}
