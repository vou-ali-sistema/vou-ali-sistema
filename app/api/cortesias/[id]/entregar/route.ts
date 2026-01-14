import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const { itemId, quantity } = body

    const courtesy = await prisma.courtesy.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      }
    })

    if (!courtesy) {
      return NextResponse.json(
        { error: 'Cortesia não encontrada' },
        { status: 404 }
      )
    }

    if (itemId && quantity) {
      // Entregar item específico
      const item = courtesy.items.find(i => i.id === itemId)
      if (!item) {
        return NextResponse.json(
          { error: 'Item não encontrado' },
          { status: 404 }
        )
      }

      const novaQuantidade = item.deliveredQuantity + quantity
      if (novaQuantidade > item.quantity) {
        return NextResponse.json(
          { error: 'Quantidade excede o total do item' },
          { status: 400 }
        )
      }

      await prisma.courtesyItem.update({
        where: { id: itemId },
        data: {
          deliveredQuantity: novaQuantidade,
        }
      })

      // Verificar se todos os itens foram entregues
      const courtesyAtualizada = await prisma.courtesy.findUnique({
        where: { id: params.id },
        include: { items: true }
      })

      const todosEntregues = courtesyAtualizada?.items.every(
        item => item.deliveredQuantity >= item.quantity
      )

      if (todosEntregues) {
        await prisma.courtesy.update({
          where: { id: params.id },
          data: {
            status: 'RETIRADA',
            deliveredAt: new Date(),
            deliveredByUserId: session.user.id,
          }
        })
      }
    } else {
      // Marcar cortesia completa como entregue
      await prisma.courtesy.update({
        where: { id: params.id },
        data: {
          status: 'RETIRADA',
          deliveredAt: new Date(),
          deliveredByUserId: session.user.id,
        }
      })
    }

    const courtesyFinal = await prisma.courtesy.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        createdByUser: true,
        deliveredByUser: true,
      }
    })

    return NextResponse.json(courtesyFinal)
  } catch (error) {
    console.error('Erro ao marcar cortesia como entregue:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar cortesia como entregue' },
      { status: 500 }
    )
  }
}
