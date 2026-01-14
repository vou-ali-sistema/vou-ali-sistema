import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { gerarTokenTroca } from '@/lib/utils'
import { sendTokenEmail } from '@/lib/email'

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
    throw new Error(`Erro ao consultar pagamento: ${response.statusText}`)
  }

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extrair paymentId do payload (pode vir em diferentes formatos)
    let paymentId: string | null = null
    
    if (body.data?.id) {
      paymentId = body.data.id
    } else if (body.resource) {
      paymentId = body.resource
    } else if (body.id) {
      paymentId = body.id
    }

    if (!paymentId) {
      console.log('Webhook recebido sem paymentId:', body)
      return NextResponse.json({ received: true })
    }

    // Consultar API do Mercado Pago para obter detalhes do pagamento
    const payment = await consultarPagamentoMP(paymentId)
    
    const externalReference = payment.external_reference
    if (!externalReference) {
      console.log('Pagamento sem external_reference:', paymentId)
      return NextResponse.json({ received: true })
    }

    const order = await prisma.order.findUnique({
      where: { id: externalReference }
    })

    if (!order) {
      console.log('Pedido não encontrado:', externalReference)
      return NextResponse.json({ received: true })
    }

    // Se status == "approved"
    if (payment.status === 'approved') {
      // Gerar exchangeToken se ainda não existir
      let exchangeToken = order.exchangeToken
      if (!exchangeToken) {
        exchangeToken = gerarTokenTroca()
      }

      // Buscar dados do cliente para enviar email
      const orderWithCustomer = await prisma.order.findUnique({
        where: { id: externalReference },
        include: { customer: true }
      })

      await prisma.order.update({
        where: { id: externalReference },
        data: {
          status: 'PAGO',
          paymentStatus: 'APPROVED',
          paidAt: new Date(),
          mpPaymentId: paymentId,
          exchangeToken: exchangeToken,
        }
      })

      console.log(`Pedido ${externalReference} aprovado e token gerado`)

      // Enviar email com token de troca
      if (orderWithCustomer?.customer?.email) {
        try {
          await sendTokenEmail({
            to: orderWithCustomer.customer.email,
            customerName: orderWithCustomer.customer.name,
            token: exchangeToken,
            orderId: externalReference,
          })
          console.log(`Email enviado para ${orderWithCustomer.customer.email}`)
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError)
          // Não falhar o webhook se o email falhar
        }
      } else {
        console.warn(`Pedido ${externalReference} aprovado mas cliente não tem email cadastrado`)
      }
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await prisma.order.update({
        where: { id: externalReference },
        data: {
          status: 'CANCELADO',
          paymentStatus: 'REJECTED',
          mpPaymentId: paymentId,
        }
      })
    } else if (payment.status === 'refunded') {
      await prisma.order.update({
        where: { id: externalReference },
        data: {
          paymentStatus: 'REFUNDED',
          mpPaymentId: paymentId,
        }
      })
    }

    // Sempre responder 200 (idempotente)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    // Sempre responder 200 mesmo em caso de erro (idempotente)
    return NextResponse.json({ received: true })
  }
}

