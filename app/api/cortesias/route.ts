import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gerarTokenTroca } from '@/lib/utils'

const criarCortesiaSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  items: z.array(z.object({
    itemType: z.enum(['ABADA', 'PULSEIRA_EXTRA']),
    size: z.string().optional(),
    quantity: z.number().int().positive(),
  })),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = criarCortesiaSchema.parse(body)

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

    const token = gerarTokenTroca()

    const courtesy = await prisma.courtesy.create({
      data: {
        name: data.name,
        phone: data.phone,
        status: 'ATIVA',
        exchangeToken: token,
        createdByUserId: session.user.id,
        items: {
          create: data.items.map(item => ({
            itemType: item.itemType,
            size: item.size,
            quantity: item.quantity,
          }))
        }
      },
      include: {
        items: true,
        createdByUser: true,
      }
    })

    return NextResponse.json(courtesy)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao criar cortesia:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cortesia' },
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

    const courtesies = await prisma.courtesy.findMany({
      include: {
        items: true,
        createdByUser: true,
        deliveredByUser: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(courtesies)
  } catch (error) {
    console.error('Erro ao listar cortesias:', error)
    return NextResponse.json(
      { error: 'Erro ao listar cortesias' },
      { status: 500 }
    )
  }
}
