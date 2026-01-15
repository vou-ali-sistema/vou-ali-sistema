import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gerarTokenTroca } from '@/lib/utils'
import { sendTokenEmail } from '@/lib/email'

async function buscarStatusPagamentoMP(externalReference: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')
  }

  const url = new URL('https://api.mercadopago.com/v1/payments/search')
  url.searchParams.set('external_reference', externalReference)
  url.searchParams.set('sort', 'date_created')
  url.searchParams.set('criteria', 'desc')
  url.searchParams.set('limit', '1')

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Erro ao buscar pagamento no Mercado Pago: ${res.status} ${res.statusText} ${text}`)
  }

  const data = await res.json()
  const payment = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null
  return payment
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        customer: true,
        deliveredByUser: true,
        lot: true,
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedido' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { status, action } = body

    const order = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (action === 'confirmar') {
      await prisma.order.update({
        where: { id: params.id },
        data: { 
          status: 'PAGO',
          paymentStatus: 'APPROVED',
          paidAt: new Date(),
        }
      })
    } else if (action === 'cancelar') {
      await prisma.order.update({
        where: { id: params.id },
        data: { 
          status: 'CANCELADO',
          paymentStatus: 'REJECTED',
        }
      })
    } else if (action === 'generate_exchange_token') {
      // Só permite gerar token para pedido pago
      if (order.status !== 'PAGO') {
        return NextResponse.json(
          { error: 'Pedido deve estar PAGO para gerar token de troca' },
          { status: 400 }
        )
      }

      if (!order.exchangeToken) {
        const token = gerarTokenTroca()
        await prisma.order.update({
          where: { id: params.id },
          data: { exchangeToken: token },
        })
      }
    } else if (action === 'resend_token_email') {
      // Reenviar email do token (sem regenerar)
      if (order.status !== 'PAGO') {
        return NextResponse.json(
          { error: 'Pedido deve estar PAGO para reenviar o token' },
          { status: 400 }
        )
      }

      const orderWithCustomer = await prisma.order.findUnique({
        where: { id: params.id },
        include: { customer: true },
      })

      if (!orderWithCustomer) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
      }

      if (!orderWithCustomer.exchangeToken) {
        // Se não tiver token ainda, gere e siga
        const token = gerarTokenTroca()
        await prisma.order.update({
          where: { id: params.id },
          data: { exchangeToken: token },
        })
        orderWithCustomer.exchangeToken = token
      }

      const email = orderWithCustomer.customer?.email
      if (!email) {
        return NextResponse.json(
          { error: 'Cliente não possui e-mail cadastrado neste pedido' },
          { status: 400 }
        )
      }

      await sendTokenEmail({
        to: email,
        customerName: orderWithCustomer.customer.name,
        token: orderWithCustomer.exchangeToken,
        orderId: orderWithCustomer.id,
        mpPaymentId: orderWithCustomer.mpPaymentId,
      })
    } else if (action === 'sync_mp') {
      const externalRef = order.externalReference || order.id
      const payment = await buscarStatusPagamentoMP(externalRef)

      if (!payment) {
        // Sem pagamento encontrado ainda: manter pendente
        return NextResponse.json({ ok: true, message: 'Nenhum pagamento encontrado no Mercado Pago ainda.' })
      }

      const mpStatus = payment.status
      const mpPaymentId = payment.id ? String(payment.id) : null

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
        // pending / in_process / etc
        paymentStatusEnum = 'PENDING'
      }

      await prisma.order.update({
        where: { id: params.id },
        data: {
          status: novoStatus,
          paymentStatus: paymentStatusEnum,
          mpPaymentId: mpPaymentId || order.mpPaymentId,
          ...(paidAt !== undefined ? { paidAt } : {}),
        },
      })
    } else if (status) {
      await prisma.order.update({
        where: { id: params.id },
        data: { status }
      })
    }

    const orderAtualizado = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        customer: true,
        deliveredByUser: true,
        lot: true,
      }
    })

    return NextResponse.json(orderAtualizado)
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    )
  }
}
