import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (type === 'payment') {
      const paymentId = data.id
      const externalReference = body.data?.external_reference || body.external_reference

      if (!externalReference) {
        return NextResponse.json({ received: true })
      }

      const order = await prisma.order.findUnique({
        where: { id: externalReference }
      })

      if (!order) {
        return NextResponse.json({ received: true })
      }

      // Atualizar status do pedido baseado no status do pagamento
      const paymentStatus = body.data?.status || body.status

      let novoStatus = order.status
      let paymentStatusEnum: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' = 'PENDING'

      if (paymentStatus === 'approved') {
        novoStatus = 'PAGO'
        paymentStatusEnum = 'APPROVED'
      } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
        novoStatus = 'CANCELADO'
        paymentStatusEnum = 'REJECTED'
      } else if (paymentStatus === 'refunded') {
        paymentStatusEnum = 'REFUNDED'
      }

      await prisma.order.update({
        where: { id: externalReference },
        data: {
          status: novoStatus,
          paymentStatus: paymentStatusEnum,
          mpPaymentId: paymentId,
          paidAt: paymentStatusEnum === 'APPROVED' ? new Date() : null,
        }
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}
