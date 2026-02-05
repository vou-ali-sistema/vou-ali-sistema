import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { criarPreferenciaPedido } from '@/lib/mercado-pago'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const criarPedidoSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().min(1),
  items: z.array(z.object({
    itemType: z.enum(['ABADA', 'PULSEIRA_EXTRA']),
    size: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPriceCents: z.number().int().positive(),
  })),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = criarPedidoSchema.parse(body)

    // Validar tamanho obrigatório para ABADA
    for (const item of data.items) {
      if (item.itemType === 'ABADA' && !item.size) {
        return NextResponse.json(
          { error: 'Tamanho é obrigatório para ABADA' },
          { status: 400 }
        )
      }
      if (item.itemType === 'PULSEIRA_EXTRA' && item.size) {
        return NextResponse.json(
          { error: 'PULSEIRA_EXTRA não deve ter tamanho' },
          { status: 400 }
        )
      }
    }

    // Calcular total em centavos
    const totalValueCents = data.items.reduce((sum, item) => {
      return sum + (item.unitPriceCents * item.quantity)
    }, 0)

    // Buscar lote ativo (Order.lotId é obrigatório no schema)
    // Pode haver múltiplos ativos (feminino e masculino) - usar o primeiro encontrado
    const activeLot = await prisma.lot.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' }, // Mais recente primeiro
    })

    if (!activeLot) {
      return NextResponse.json(
        { error: 'Nenhum lote ativo encontrado. Configure um lote ativo no painel admin.' },
        { status: 500 }
      )
    }

    // Criar ou buscar cliente
    const customer = await prisma.customer.upsert({
      where: { 
        phone: data.customerPhone 
      },
      update: {
        name: data.customerName,
        email: data.customerEmail,
      },
      create: {
        name: data.customerName,
        phone: data.customerPhone,
        email: data.customerEmail,
      }
    })

    // Criar pedido
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        lotId: activeLot.id,
        status: 'PENDENTE',
        totalValueCents,
        externalReference: undefined, // será atualizado após criar
        items: {
          create: data.items.map(item => ({
            itemType: item.itemType,
            size: item.size,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          }))
        }
      },
      include: {
        items: true,
        customer: true,
      }
    })

    // Atualizar externalReference com o ID
    await prisma.order.update({
      where: { id: order.id },
      data: { externalReference: order.id }
    })

    // Criar preferência Mercado Pago
    const preference = await criarPreferenciaPedido(order.id)
    
    await prisma.order.update({
      where: { id: order.id },
      data: {
        mpPreferenceId: preference.id,
        paymentLink: preference.init_point,
      }
    })

    return NextResponse.json({
      order: {
        ...order,
        externalReference: order.id,
        paymentLink: preference.init_point,
      },
      paymentUrl: preference.init_point,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
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
    const status = searchParams.get('status')
    const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20) || 20))
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          customer: true,
          lot: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where })
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('Erro ao listar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro ao listar pedidos' },
      { status: 500 }
    )
  }
}
