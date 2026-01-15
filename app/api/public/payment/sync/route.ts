import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { gerarTokenTroca } from '@/lib/utils'
import { sendTokenEmail } from '@/lib/email'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  externalReference: z.string().trim().optional(),
  preferenceId: z.string().trim().optional(),
  paymentId: z.string().trim().optional(),
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
    throw new Error(`MP ${res.status} ${res.statusText} ${text}`)
  }
  return text ? JSON.parse(text) : null
}

async function buscarPagamentoMP(opts: { paymentId?: string; externalReference?: string; preferenceId?: string }) {
  if (opts.paymentId) {
    const pid = String(opts.paymentId).trim()
    if (pid) {
      return mpFetchJson(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(pid)}`)
    }
  }

  const url = new URL('https://api.mercadopago.com/v1/payments/search')
  if (opts.externalReference) url.searchParams.set('external_reference', opts.externalReference)
  if (opts.preferenceId) url.searchParams.set('preference_id', opts.preferenceId)
  url.searchParams.set('sort', 'date_created')
  url.searchParams.set('criteria', 'desc')
  url.searchParams.set('limit', '1')

  const data = await mpFetchJson(url.toString())
  const payment = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null
  return payment
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = schema.parse(body)

    const externalReference = parsed.externalReference || undefined
    const preferenceId = parsed.preferenceId || undefined
    const paymentId = parsed.paymentId || undefined

    // Encontrar o pedido: por externalReference (id) ou por mpPreferenceId
    let order =
      (externalReference
        ? await prisma.order.findUnique({ where: { id: externalReference } })
        : null) ||
      (preferenceId
        ? await prisma.order.findFirst({ where: { mpPreferenceId: preferenceId } })
        : null) ||
      (paymentId ? await prisma.order.findFirst({ where: { mpPaymentId: paymentId } }) : null)

    if (!order) {
      return NextResponse.json({ ok: false, error: 'Pedido não encontrado' }, { status: 404 })
    }

    const payment = await buscarPagamentoMP({
      paymentId,
      externalReference: order.externalReference || order.id,
      preferenceId: preferenceId || order.mpPreferenceId || undefined,
    })

    if (!payment) {
      return NextResponse.json({
        ok: true,
        foundPayment: false,
        orderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      })
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
    console.error('Erro ao sync pagamento (public):', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: 'Erro ao sincronizar pagamento', details: msg }, { status: 500 })
  }
}

