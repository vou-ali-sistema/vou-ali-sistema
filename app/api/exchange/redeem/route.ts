import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const redeemSchema = z.object({
  token: z.string().min(1),
  deliveries: z.array(z.object({
    orderItemId: z.string().optional(),
    courtesyItemId: z.string().optional(),
    deliverQty: z.number().int().min(1),
  })),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = redeemSchema.parse(body)

    // Buscar Order por exchangeToken
    const order = await prisma.order.findUnique({
      where: { exchangeToken: data.token },
      include: {
        items: true,
      }
    })

    if (order) {
      // Validar que Order está PAGO
      if (order.status !== 'PAGO') {
        return NextResponse.json(
          { error: 'Pedido deve estar pago para entregar itens' },
          { status: 400 }
        )
      }

      // Processar entregas
      for (const delivery of data.deliveries) {
        if (!delivery.orderItemId) {
          return NextResponse.json(
            { error: 'orderItemId é obrigatório para pedidos' },
            { status: 400 }
          )
        }

        const item = order.items.find(i => i.id === delivery.orderItemId)
        if (!item) {
          return NextResponse.json(
            { error: `Item ${delivery.orderItemId} não encontrado no pedido` },
            { status: 404 }
          )
        }

        // Validar que deliverQty não ultrapassa (quantity - deliveredQuantity)
        const maxDeliver = item.quantity - item.deliveredQuantity
        if (delivery.deliverQty > maxDeliver) {
          return NextResponse.json(
            { error: `Quantidade a entregar (${delivery.deliverQty}) excede o disponível (${maxDeliver}) para item ${item.id}` },
            { status: 400 }
          )
        }

        // Atualizar deliveredQuantity
        await prisma.orderItem.update({
          where: { id: delivery.orderItemId },
          data: {
            deliveredQuantity: item.deliveredQuantity + delivery.deliverQty,
            lastDeliveredAt: new Date(),
            lastDeliveredByUserId: session.user.id,
          }
        })
      }

      // Verificar se todos os itens foram entregues
      const orderAtualizado = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true }
      })

      const todosEntregues = orderAtualizado?.items.every(
        item => item.deliveredQuantity >= item.quantity
      )

      if (todosEntregues && orderAtualizado) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'RETIRADO',
            deliveredAt: new Date(),
            deliveredByUserId: session.user.id,
          }
        })
      }

      const orderFinal = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: true,
          customer: true,
          deliveredByUser: true,
        }
      })

      return NextResponse.json({
        type: 'order',
        data: orderFinal,
      })
    }

    // Buscar Courtesy por exchangeToken
    const courtesy = await prisma.courtesy.findUnique({
      where: { exchangeToken: data.token },
      include: {
        items: true,
      }
    })

    if (courtesy) {
      // Validar que Courtesy está ATIVA
      if (courtesy.status !== 'ATIVA') {
        return NextResponse.json(
          { error: 'Cortesia deve estar ativa para entregar itens' },
          { status: 400 }
        )
      }

      // Processar entregas
      for (const delivery of data.deliveries) {
        if (!delivery.courtesyItemId) {
          return NextResponse.json(
            { error: 'courtesyItemId é obrigatório para cortesias' },
            { status: 400 }
          )
        }

        const item = courtesy.items.find(i => i.id === delivery.courtesyItemId)
        if (!item) {
          return NextResponse.json(
            { error: `Item ${delivery.courtesyItemId} não encontrado na cortesia` },
            { status: 404 }
          )
        }

        // Validar que deliverQty não ultrapassa (quantity - deliveredQuantity)
        const maxDeliver = item.quantity - item.deliveredQuantity
        if (delivery.deliverQty > maxDeliver) {
          return NextResponse.json(
            { error: `Quantidade a entregar (${delivery.deliverQty}) excede o disponível (${maxDeliver}) para item ${item.id}` },
            { status: 400 }
          )
        }

        // Atualizar deliveredQuantity
        await prisma.courtesyItem.update({
          where: { id: delivery.courtesyItemId },
          data: {
            deliveredQuantity: item.deliveredQuantity + delivery.deliverQty,
          }
        })
      }

      // Verificar se todos os itens foram entregues
      const courtesyAtualizada = await prisma.courtesy.findUnique({
        where: { id: courtesy.id },
        include: { items: true }
      })

      const todosEntregues = courtesyAtualizada?.items.every(
        item => item.deliveredQuantity >= item.quantity
      )

      if (todosEntregues && courtesyAtualizada) {
        await prisma.courtesy.update({
          where: { id: courtesy.id },
          data: {
            status: 'RETIRADA',
            deliveredAt: new Date(),
            deliveredByUserId: session.user.id,
          }
        })
      }

      const courtesyFinal = await prisma.courtesy.findUnique({
        where: { id: courtesy.id },
        include: {
          items: true,
          createdByUser: true,
          deliveredByUser: true,
        }
      })

      return NextResponse.json({
        type: 'courtesy',
        data: courtesyFinal,
      })
    }

    return NextResponse.json(
      { error: 'Token não encontrado' },
      { status: 404 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao processar entrega:', error)
    return NextResponse.json(
      { error: 'Erro ao processar entrega' },
      { status: 500 }
    )
  }
}

