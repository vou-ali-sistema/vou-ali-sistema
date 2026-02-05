import { MercadoPagoConfig, Preference } from 'mercadopago'
import { prisma } from './prisma'

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.warn('MERCADOPAGO_ACCESS_TOKEN não está configurado no .env')
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  },
})

export const mercadoPago = new Preference(client)

export async function criarPreferenciaPedido(orderId: string) {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não está configurado. Configure no Vercel (Settings > Environment Variables) para produção.')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      lot: true,
    },
  })

  if (!order) {
    throw new Error('Pedido não encontrado')
  }

  if (!order.items || order.items.length === 0) {
    throw new Error('Pedido não possui itens')
  }

  const lotName = order.lot?.name || ''

  const items = order.items.map(item => {
    let title = ''
    if (item.itemType === 'ABADA') {
      title = `Abadá Bloco Vou Ali ${lotName ? `- ${lotName}` : ''} - Tam ${item.size || 'Tamanho Único'}`
    } else {
      title = `Pulseira Extra ${lotName ? `- ${lotName}` : ''}`
    }
    
    return {
      id: item.id,
      title,
      quantity: item.quantity,
      unit_price: item.unitPriceCents / 100, // Usar preço congelado do pedido
    }
  })

  try {
    // Garantir que temos uma URL base válida
    let baseUrl = process.env.NEXTAUTH_URL || process.env.APP_BASE_URL || 'http://localhost:3000'
    
    // Remover barra final se houver
    baseUrl = baseUrl.replace(/\/$/, '')
    
    // IMPORTANTE: Mercado Pago não aceita mais URLs HTTP (apenas HTTPS)
    // Para desenvolvimento local, você precisa usar ngrok ou similar
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.startsWith('http://')
    
    // Incluir orderId na URL de retorno para facilitar busca do pedido
    const successUrl = `${baseUrl}/troca/pendente?orderId=${orderId}`
    const failureUrl = `${baseUrl}/troca/pendente?orderId=${orderId}`
    const pendingUrl = `${baseUrl}/troca/pendente?orderId=${orderId}`
    const notificationUrl = `${baseUrl}/api/webhooks/mercadopago`

    console.log('Criando preferência com URLs:', {
      baseUrl,
      success: successUrl,
      failure: failureUrl,
      pending: pendingUrl,
      notification: notificationUrl,
      isLocalhost,
    })

    // Construir o body da preferência (apenas items e external_reference - como estava quando funcionava)
    const preferenceBody: any = {
      items,
      external_reference: order.externalReference || orderId,
    }

    // Se for localhost/HTTP, não adicionar back_urls e auto_return
    // (Mercado Pago não aceita HTTP)
    if (!isLocalhost) {
      preferenceBody.back_urls = {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      }
      preferenceBody.auto_return = 'approved'
      preferenceBody.notification_url = notificationUrl
    } else {
      // Para desenvolvimento local, apenas criar a preferência sem URLs
      // O usuário precisará usar o init_point retornado
      console.warn('⚠️ Modo desenvolvimento: URLs HTTP não são suportadas pelo Mercado Pago. Use ngrok para HTTPS ou teste em produção.')
      // Ainda assim, tentar criar a preferência (pode funcionar sem back_urls)
    }

    const preference = await mercadoPago.create({
      body: preferenceBody,
    })

    return preference
  } catch (error: any) {
    console.error('Erro detalhado ao criar preferência:', error)
    
    // Melhorar mensagem de erro
    if (error?.message) {
      throw new Error(`Erro ao criar preferência Mercado Pago: ${error.message}`)
    }
    
    if (error?.response?.data) {
      const errorData = error.response.data
      throw new Error(`Erro Mercado Pago: ${JSON.stringify(errorData)}`)
    }
    
    throw error
  }
}
