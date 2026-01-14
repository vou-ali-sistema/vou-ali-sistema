import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const mediaSchema = z.object({
  mediaUrl: z.string().min(1, 'URL da mídia é obrigatória'),
  mediaType: z.enum(['image', 'video']),
  displayOrder: z.number().int().default(0),
})

// GET - Listar mídias de um card
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const media = await prisma.promoCardMedia.findMany({
      where: { promoCardId: params.id },
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json(media)
  } catch (error) {
    console.error('Erro ao buscar mídias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar mídias' },
      { status: 500 }
    )
  }
}

// POST - Adicionar mídia a um card
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
    const data = mediaSchema.parse(body)

    // Verificar se o card existe
    const card = await prisma.promoCard.findUnique({
      where: { id: params.id },
    })

    if (!card) {
      return NextResponse.json(
        { error: 'Card não encontrado' },
        { status: 404 }
      )
    }

    const media = await prisma.promoCardMedia.create({
      data: {
        promoCardId: params.id,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        displayOrder: data.displayOrder,
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar mídia:', error)
    return NextResponse.json(
      { error: 'Erro ao criar mídia' },
      { status: 500 }
    )
  }
}
