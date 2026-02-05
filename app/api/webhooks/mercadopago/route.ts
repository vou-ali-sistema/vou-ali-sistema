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
    const err = new Error(`Erro ao consultar pagamento: ${response.status} ${response.statusText} ${text}`) as Error & { status?: number }
    err.status = response.status
    throw err
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

  let paymentId: string | null = null
  if (body?.data?.id != null) {
    paymentId = extractPaymentId(String(body.data.id))
  }
  if (!paymentId && body?.resource) paymentId = extractPaymentId(body.resource)
  if (!paymentId && body?.id != null) paymentId = extractPaymentId(String(body.id))
  if (!paymentId && query['data.id']) paymentId = extractPaymentId(query['data.id'])

  if (!paymentId || !/^\d+$/.test(paymentId)) return quick200()

  try {
    const payment = await consultarPagamentoMP(paymentId)
    const externalReference =
      payment.external_reference != null
        ? String(payment.external_reference).trim()
        : null

    if (!externalReference) return quick200()

    const order = await prisma.order.findUnique({
      where: { id: externalReference },
    })

    if (!order) return quick200()

    const statusAntigo = order.status
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
          console.error('[MP_WEBHOOK] Erro ao enviar email:', emailError)
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
    } else if (payment.status === 'refunded') {
      await prisma.order.update({
        where: { id: externalReference },
        data: {
          paymentStatus: 'REFUNDED',
          mpPaymentId: paymentId,
        },
      })
    }

    return quick200()
  } catch (error) {
    console.error('[MP_WEBHOOK] Erro ao processar:', error)
    return quick200()
  }
}

