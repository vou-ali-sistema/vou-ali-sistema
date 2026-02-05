import { MercadoPagoConfig, Preference } from 'mercadopago'
import { prisma } from './prisma'

if (!process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()) {
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
  const token = (process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim()
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não está configurado. Configure no Vercel (Settings > Environment Variables) para produção.')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      lot: true,
      customer: true,
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
    const unitPrice = Math.max(0.01, item.unitPriceCents / 100) // MP exige valor mínimo
    return {
      id: item.id,
      title,
      quantity: item.quantity,
      unit_price: unitPrice,
      currency_id: 'BRL',
    }
  })

  try {
    // Em produção (Vercel): use APP_BASE_URL = https://seu-dominio.com para notification_url e back_urls
    let baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    baseUrl = baseUrl.replace(/\/$/, '')
    const isProd = process.env.VERCEL === '1' || (baseUrl.startsWith('https://') && !baseUrl.includes('localhost'))
    const tokenHint = token ? `${token.slice(0, 19)}...${token.slice(-6)}` : 'vazio'
    if (isProd) {
      console.log('[MP_CREATE] Ambiente produção: token', tokenHint, 'baseUrl', baseUrl)
    }

    // IMPORTANTE: Mercado Pago não aceita mais URLs HTTP (apenas HTTPS)
    // Para desenvolvimento local, você precisa usar ngrok ou similar
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.startsWith('http://')
    const isHttps = baseUrl.startsWith('https://')

    // Incluir orderId na URL de retorno para facilitar busca do pedido
    const successUrl = `${baseUrl}/troca/pendente?orderId=${orderId}`
    const failureUrl = `${baseUrl}/troca/pendente?orderId=${orderId}`
    const pendingUrl = `${baseUrl}/troca/pendente?orderId=${orderId}`
    const notificationUrl = `${baseUrl}/api/webhooks/mercadopago`

    console.log('[MP_CREATE] URLs:', {
      orderId,
      baseUrl,
      notification: notificationUrl,
      isLocalhost,
      notificationSent: isHttps,
    })

    const preferenceBody: any = {
      items,
      external_reference: order.externalReference || orderId,
      // Liberar TODAS as formas de pagamento: Pix, cartão crédito/débito, boleto, etc.
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
      },
    }

    // Mercado Pago EXIGE payer.email para exibir Pix, cartão e outras opções de pagamento
    const email = order.customer?.email?.trim()
    if (!email) {
      throw new Error('Email do cliente é obrigatório para exibir opções de pagamento no Mercado Pago. Verifique se o pedido inclui o email do cliente.')
    }
    preferenceBody.payer = {
      email,
      name: order.customer?.name?.trim() || undefined,
    }

    // notification_url: já definido acima quando isHttps (crítico para pedido virar PAGO)
    if (isHttps) {
      preferenceBody.notification_url = notificationUrl
    }

    // Se for localhost/HTTP, não adicionar back_urls e auto_return (Mercado Pago não aceita HTTP)
    if (!isLocalhost) {
      preferenceBody.back_urls = {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      }
      preferenceBody.auto_return = 'approved'
    } else {
      console.warn('⚠️ Modo desenvolvimento: URLs HTTP não são suportadas pelo Mercado Pago. Use ngrok para HTTPS ou teste em produção.')
    }

    const preference = await mercadoPago.create({
      body: preferenceBody,
    })

    const rawInitPoint = (preference as any).init_point ?? null
    const rawSandboxPoint = (preference as any).sandbox_init_point ?? null

    if (isProd) {
      // Produção (Vercel): usar SOMENTE init_point. Token de teste retorna só sandbox_init_point.
      if (rawInitPoint && !rawInitPoint.includes('sandbox')) {
        console.log('[MP_CREATE] Produção: usando init_point', {
          orderId,
          tokenHint,
          urlPreview: rawInitPoint.slice(0, 60) + '...',
        })
      } else if (rawSandboxPoint || (rawInitPoint && rawInitPoint.includes('sandbox'))) {
        const url = rawSandboxPoint || rawInitPoint
        console.error('[MP_CREATE] ERRO PRODUÇÃO: token de teste detectado. URL de checkout é sandbox.', {
          orderId,
          tokenHint,
          urlPreview: url?.slice(0, 60),
        })
        throw new Error(
          'Em produção (Vercel) o checkout está indo para sandbox. Configure MERCADOPAGO_ACCESS_TOKEN com o Access Token de PRODUÇÃO no Vercel (Settings > Environment Variables). Use as credenciais de produção do app no Mercado Pago.'
        )
      } else {
        throw new Error('Mercado Pago não retornou URL de pagamento. Verifique MERCADOPAGO_ACCESS_TOKEN (use token de produção no Vercel).')
      }
    }

    const paymentUrl = rawInitPoint && !String(rawInitPoint).includes('sandbox')
      ? rawInitPoint
      : (rawSandboxPoint || rawInitPoint)
    if (!paymentUrl) {
      throw new Error('Mercado Pago não retornou URL de pagamento. Verifique as credenciais (teste vs produção).')
    }

    const preferenceId = (preference as any).id ?? null
    const externalRef = order.externalReference || orderId
    console.log('[MP_CREATE]', {
      orderId,
      preferenceId,
      init_point: paymentUrl.slice(0, 80) + (paymentUrl.length > 80 ? '...' : ''),
      external_reference: externalRef,
      tokenHint,
      isProduction: isProd,
    })

    return { ...preference, init_point: paymentUrl }
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
