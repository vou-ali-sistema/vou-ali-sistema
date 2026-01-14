import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { gerarTokenTroca } from '@/lib/utils'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const criarTrocaSchema = z.object({
  orderId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = criarTrocaSchema.parse(body)

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
        customer: true,
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se pedido está pago
    if (order.status !== 'PAGO') {
      return NextResponse.json(
        { error: 'Pedido deve estar pago para liberar troca' },
        { status: 400 }
      )
    }

    // Verificar se já existe token de troca
    if (order.exchangeToken) {
      return NextResponse.json(
        { error: 'Já existe uma troca para este pedido' },
        { status: 400 }
      )
    }

    // Criar token de troca
    const token = gerarTokenTroca()
    
    await prisma.order.update({
      where: { id: data.orderId },
      data: {
        exchangeToken: token,
      }
    })

    const orderAtualizado = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
        customer: true,
      }
    })

    return NextResponse.json({
      order: orderAtualizado,
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao criar troca:', error)
    return NextResponse.json(
      { error: 'Erro ao criar troca' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (token) {
      const order = await prisma.order.findUnique({
        where: { exchangeToken: token },
        include: {
          items: true,
          customer: true,
        }
      })

      if (!order) {
        return NextResponse.json(
          { error: 'Troca não encontrada' },
          { status: 404 }
        )
      }

      return NextResponse.json(order)
    }

    // Listar todas as trocas (pedidos com exchangeToken)
    const orders = await prisma.order.findMany({
      where: {
        exchangeToken: { not: null }
      },
      include: {
        items: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Erro ao buscar trocas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar trocas' },
      { status: 500 }
    )
  }
}
