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
    const err = new Error(`MP ${res.status} ${res.statusText} ${text}`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return text ? JSON.parse(text) : null
}

function isNumericPaymentId(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

async function buscarPagamentoMP(opts: { paymentId?: string; externalReference?: string; preferenceId?: string }) {
  const pid = opts.paymentId?.trim()
  const hasExternalRef = Boolean(opts.externalReference?.trim())
  const preferenceIdForSearch = opts.preferenceId?.trim() || (pid && !isNumericPaymentId(pid) ? pid : undefined)
  const hasPreferenceId = Boolean(preferenceIdForSearch)

  // Só usar GET /v1/payments/{id} quando temos APENAS paymentId numérico (evita 404 por ID de outro ambiente ou preference_id)
  if (pid && isNumericPaymentId(pid) && !hasExternalRef && !hasPreferenceId) {
    return mpFetchJson(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(pid)}`)
  }

  const url = new URL('https://api.mercadopago.com/v1/payments/search')
  url.searchParams.set('sort', 'date_created')
  url.searchParams.set('criteria', 'desc')
  url.searchParams.set('range', 'date_created')
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  url.searchParams.set('begin_date', thirtyDaysAgo.toISOString())
  url.searchParams.set('end_date', now.toISOString())
  if (opts.externalReference) url.searchParams.set('external_reference', opts.externalReference)
  if (preferenceIdForSearch) url.searchParams.set('preference_id', preferenceIdForSearch)
  url.searchParams.set('limit', '10')

  const data = await mpFetchJson(url.toString())
  const payments = Array.isArray(data?.results) ? data.results : []
  
  // Se temos externalReference, priorizar pagamentos com esse external_reference
  if (opts.externalReference && payments.length > 0) {
    const matching = payments.find((p: any) => p.external_reference === opts.externalReference)
    if (matching) return matching
  }
  
  // Retornar o mais recente
  return payments.length > 0 ? payments[0] : null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = schema.parse(body)

    const externalReference = parsed.externalReference || undefined
    const preferenceId = parsed.preferenceId || undefined
    let paymentId = parsed.paymentId || undefined

    // Validar payment_id quando enviado: deve ser numérico
    if (paymentId != null && String(paymentId).trim() !== '') {
      const pidStr = String(paymentId).trim()
      if (isNaN(Number(pidStr)) || !/^\d+$/.test(pidStr)) {
        return NextResponse.json({ ok: false, error: 'payment_id inválido' }, { status: 400 })
      }
      paymentId = pidStr
    } else if (paymentId !== undefined) {
      paymentId = undefined
    }

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

    let payment: any = null
    try {
      payment = await buscarPagamentoMP({
        paymentId,
        externalReference: order.externalReference || order.id,
        preferenceId: preferenceId || order.mpPreferenceId || undefined,
      })
    } catch (mpError) {
      const err = mpError as Error & { status?: number }
      // Re-throw para ser capturado pelo catch externo que já trata 404/500
      throw err
    }

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
    const err = error as Error & { status?: number }
    if (typeof err.status === 'number' && err.status === 404) {
      return NextResponse.json(
        { ok: false, error: 'Pagamento não encontrado no Mercado Pago' },
        { status: 404 }
      )
    }
    console.error('Erro ao sync pagamento (public):', error)
    return NextResponse.json(
      { ok: false, error: 'Erro interno ao sincronizar pagamento' },
      { status: 500 }
    )
  }
}

