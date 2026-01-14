import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
