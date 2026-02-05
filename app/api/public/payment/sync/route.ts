import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { gerarTokenTroca } from '@/lib/utils'
import { sendTokenEmail } from '@/lib/email'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Contrato: POST body { "payment_id": "13123456789" } */
const schema = z.object({
  payment_id: z.string().trim().optional(),
  paymentId: z.string().trim().optional(), // aceita camelCase para compat
})

function maskEmail(email: string) {
  const [user, domain] = email.split('@')
  if (!domain) return email
  const u = user || ''
  const maskedUser = u.length <= 2 ? `${u[0] || '*'}*` : `${u.slice(0, 2)}***${u.slice(-1)}`
  return `${maskedUser}@${domain}`
}

async function mpFetchJson(url: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  const text = await res.text().catch(() => '')
  if (!res.ok) {
    const err = new Error(`MP ${res.status} ${res.statusText} ${text}`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return text ? JSON.parse(text) : null
}

function isNumericPaymentId(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

/**
 * Consulta pagamento no Mercado Pago apenas por payment_id (id numérico).
 * CORRETO: GET https://api.mercadopago.com/v1/payments/{payment_id}
 * Não usar preference_id para sincronização.
 */
async function getPaymentById(paymentId: string): Promise<any> {
  if (!paymentId || !isNumericPaymentId(paymentId)) {
    return null
  }
  return mpFetchJson(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = schema.parse(body)

    const rawPaymentId = (parsed as any).payment_id ?? parsed.paymentId
    const paymentIdStr = rawPaymentId != null ? String(rawPaymentId).trim() : ''

    if (!paymentIdStr || !isNumericPaymentId(paymentIdStr)) {
      return NextResponse.json(
        { error: 'payment_id inválido ou ausente. Envie { "payment_id": "13123456789" }.' },
        { status: 400 }
      )
    }

    let payment: any = null
    try {
      payment = await getPaymentById(paymentIdStr)
    } catch (mpError) {
      const err = mpError as Error & { status?: number }
      throw err
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado no Mercado Pago' },
        { status: 404 }
      )
    }

    const externalReference = payment.external_reference != null ? String(payment.external_reference).trim() : null
    const order = externalReference
      ? await prisma.order.findUnique({ where: { id: externalReference } })
      : await prisma.order.findFirst({ where: { mpPaymentId: paymentIdStr } })

    if (!order) {
      return NextResponse.json({ ok: false, error: 'Pedido não encontrado' }, { status: 404 })
    }

    const mpStatus = String(payment.status || '')
    const mpPaymentId = payment.id ? String(payment.id) : null

    // Mapear status interno
    let novoStatus: any = order.status
    let paymentStatusEnum: any = order.paymentStatus
    let paidAt: Date | null | undefined = undefined

    if (mpStatus === 'approved') {
      novoStatus = 'PAGO'
      paymentStatusEnum = 'APPROVED'
      paidAt = order.paidAt || new Date()
    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      novoStatus = 'CANCELADO'
      paymentStatusEnum = 'REJECTED'
      paidAt = null
    } else if (mpStatus === 'refunded') {
      paymentStatusEnum = 'REFUNDED'
    } else {
      paymentStatusEnum = 'PENDING'
    }

    // Se aprovado, garantir token
    let exchangeToken = order.exchangeToken
    if (novoStatus === 'PAGO' && !exchangeToken) {
      exchangeToken = gerarTokenTroca()
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: novoStatus,
        paymentStatus: paymentStatusEnum,
        mpPaymentId: mpPaymentId || order.mpPaymentId,
        ...(paidAt !== undefined ? { paidAt } : {}),
        ...(exchangeToken ? { exchangeToken } : {}),
      },
    })

    // Se aprovado, tentar enviar email (sem falhar a resposta)
    let emailSent: boolean | null = null
    let emailError: string | null = null
    let emailMasked: string | null = null

    if (novoStatus === 'PAGO' && exchangeToken) {
      const orderWithCustomer = await prisma.order.findUnique({
        where: { id: order.id },
        include: { customer: true },
      })
      const email = orderWithCustomer?.customer?.email || null
      if (email) {
        emailMasked = maskEmail(email)
        const result = await sendTokenEmail({
          to: email,
          customerName: orderWithCustomer!.customer.name,
          token: exchangeToken,
          orderId: order.id,
          mpPaymentId: mpPaymentId || order.mpPaymentId,
        })
        emailSent = (result as any)?.success === true
        if (!emailSent) emailError = (result as any)?.errorMessage || 'Falha ao enviar email'
      } else {
        emailSent = null
      }
    }

    return NextResponse.json({
      ok: true,
      foundPayment: true,
      mpStatus,
      orderId: order.id,
      status: novoStatus,
      paymentStatus: paymentStatusEnum,
      mpPaymentId: mpPaymentId || order.mpPaymentId,
      exchangeToken: exchangeToken || null,
      trocaUrl: exchangeToken ? `/troca/${exchangeToken}` : null,
      emailSent,
      email: emailMasked,
      emailError,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    const err = error as Error & { status?: number }
    if (typeof err.status === 'number' && err.status === 404) {
      return NextResponse.json(
        { ok: false, error: 'Pagamento não encontrado no Mercado Pago' },
        { status: 404 }
      )
    }
    console.error('Erro ao sync pagamento (public):', error)
    const msg = err?.message || (error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        ok: false,
        error: 'Erro interno ao sincronizar pagamento',
        details: msg,
      },
      { status: 500 }
    )
  }
}

