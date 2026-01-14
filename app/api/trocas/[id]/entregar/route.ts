import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const entregarItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = entregarItemSchema.parse(body)

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    const item = order.items.find(i => i.id === data.itemId)

    if (!item) {
      return NextResponse.json(
        { error: 'Item não encontrado no pedido' },
        { status: 404 }
      )
    }

    const novaQuantidade = item.deliveredQuantity + data.quantity

    if (novaQuantidade > item.quantity) {
      return NextResponse.json(
        { error: 'Quantidade excede o total do item' },
        { status: 400 }
      )
    }

    await prisma.orderItem.update({
      where: { id: data.itemId },
      data: {
        deliveredQuantity: novaQuantidade,
        lastDeliveredAt: new Date(),
        lastDeliveredByUserId: session.user.id,
      }
    })

    // Verificar se todos os itens foram entregues
    const orderAtualizado = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      }
    })

    const todosEntregues = orderAtualizado?.items.every(
      item => item.deliveredQuantity >= item.quantity
    )

    if (todosEntregues && orderAtualizado) {
      await prisma.order.update({
        where: { id: params.id },
        data: { 
          status: 'RETIRADO',
          deliveredAt: new Date(),
          deliveredByUserId: session.user.id,
        }
      })
    }

    const orderFinal = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        customer: true,
        deliveredByUser: true,
      }
    })

    return NextResponse.json(orderFinal)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao entregar item:', error)
    return NextResponse.json(
      { error: 'Erro ao entregar item' },
      { status: 500 }
    )
  }
}
