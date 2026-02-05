import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { gerarTokenTroca } from '@/lib/utils'
import { sendTokenEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function extractPaymentId(raw: unknown): string | null {
  if (!raw) return null
  const s = String(raw).trim()
  if (!s) return null

  // Se vier uma URL do tipo .../payments/123 ou .../payments/123?x=y
  const m = s.match(/\/payments\/(\d+)(?:\b|\/|\?|#)/i)
  if (m?.[1]) return m[1]

  // Se vier apenas o número
  const onlyDigits = s.match(/^\d+$/)
  if (onlyDigits) return s

  // Alguns payloads podem vir como "/v1/payments/123"
  const tailDigits = s.match(/(\d+)\s*$/)
  return tailDigits?.[1] || null
}

async function consultarPagamentoMP(paymentId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Erro ao consultar pagamento: ${response.status} ${response.statusText} ${text}`)
  }

  return response.json()
}

export async function GET(request: NextRequest) {
  const query: Record<string, string> = {}
  try {
    const u = new URL(request.url)
    u.searchParams.forEach((v, k) => { query[k] = v })
  } catch {
    /* ignore */
  }
  console.log('[Webhook MP] GET recebido (ping?):', query)
  return NextResponse.json({ received: true })
}

export async function POST(request: NextRequest) {
  const quick200 = () => NextResponse.json({ received: true })

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const url = request.url
  const query: Record<string, string> = {}
  try {
    const u = new URL(url)
    u.searchParams.forEach((v, k) => { query[k] = v })
  } catch {
    /* ignore */
  }

  const headersLog = {
    'x-signature': request.headers.get('x-signature') ?? undefined,
    'x-request-id': request.headers.get('x-request-id') ?? undefined,
    'content-type': request.headers.get('content-type') ?? undefined,
  }

  console.log('[Webhook MP] Recebido:', {
    method: request.method,
    query,
    headers: headersLog,
    bodyKeys: Object.keys(body),
    body: JSON.stringify(body).slice(0, 500),
  })

  let paymentId: string | null = null
  if (body?.data?.id != null) {
    paymentId = extractPaymentId(String(body.data.id))
  }
  if (!paymentId && body?.resource) paymentId = extractPaymentId(body.resource)
  if (!paymentId && body?.id != null) paymentId = extractPaymentId(String(body.id))
  if (!paymentId && query['data.id']) paymentId = extractPaymentId(query['data.id'])

  if (!paymentId) {
    console.log('[Webhook MP] Sem paymentId, ignorando. body:', body)
    return quick200()
  }

  try {
    const payment = await consultarPagamentoMP(paymentId)
    const externalReference =
      payment.external_reference != null
        ? String(payment.external_reference).trim()
        : null

    if (!externalReference) {
      console.log('[Webhook MP] Pagamento sem external_reference:', paymentId, 'payment keys:', Object.keys(payment))
      return quick200()
    }

    const order = await prisma.order.findUnique({
      where: { id: externalReference },
    })

    if (!order) {
      console.log('[Webhook MP] Pedido não encontrado:', externalReference)
      return quick200()
    }

    if (payment.status === 'approved') {
      let exchangeToken = order.exchangeToken
      if (!exchangeToken) exchangeToken = gerarTokenTroca()

      await prisma.order.update({
        where: { id: externalReference },
        data: {
          status: 'PAGO',
          paymentStatus: 'APPROVED',
          paidAt: new Date(),
          mpPaymentId: paymentId,
          exchangeToken,
        },
      })

      console.log('[Webhook MP] Pedido atualizado PAGO:', externalReference)

      const orderWithCustomer = await prisma.order.findUnique({
        where: { id: externalReference },
        include: { customer: true },
      })
      if (orderWithCustomer?.customer?.email) {
        sendTokenEmail({
          to: orderWithCustomer.customer.email,
          customerName: orderWithCustomer.customer.name,
          token: exchangeToken,
          orderId: externalReference,
          mpPaymentId: paymentId,
        }).catch((emailError) => {
          console.error('[Webhook MP] Erro ao enviar email:', emailError)
        })
      }
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await prisma.order.update({
        where: { id: externalReference },
        data: {
          status: 'CANCELADO',
          paymentStatus: 'REJECTED',
          mpPaymentId: paymentId,
        },
      })
      console.log('[Webhook MP] Pedido atualizado CANCELADO:', externalReference)
    } else if (payment.status === 'refunded') {
      await prisma.order.update({
        where: { id: externalReference },
        data: {
          paymentStatus: 'REFUNDED',
          mpPaymentId: paymentId,
        },
      })
      console.log('[Webhook MP] Pedido atualizado REFUNDED:', externalReference)
    }

    return quick200()
  } catch (error) {
    console.error('[Webhook MP] Erro ao processar:', error)
    return quick200()
  }
}

