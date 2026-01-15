import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const promoCardSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  imageUrl: z.string().optional().or(z.literal('')).transform(val => {
    if (!val || val === '') return undefined
    // Aceitar URLs completas ou relativas (começando com /)
    if (val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://')) {
      return val
    }
    return undefined
  }),
  active: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  backgroundColor: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  textColor: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  autoPlay: z.boolean().default(true),
  slideInterval: z.number().int().min(1000).max(30000).default(5000),
  linkEnabled: z.boolean().default(true),
  linkUrl: z.string().optional().or(z.literal('')).transform(val => {
    if (!val || val === '') return undefined
    // Aceitar URLs completas ou relativas (começando com /)
    if (val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://')) {
      return val
    }
    return undefined
  }),
  placement: z.enum(['HOME', 'COMPRAR', 'BOTH']).default('BOTH'),
  // UI envia '' quando não selecionado; aceitar e normalizar para undefined.
  comprarSlot: z
    .enum(['TOP', 'BOTTOM'])
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => {
      if (!val) return undefined
      return val
    }),
})

// GET - Buscar card específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const card = await prisma.promoCard.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    })

    if (!card) {
      return NextResponse.json(
        { error: 'Card não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error('Erro ao buscar card:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar card' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar card
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = promoCardSchema.parse(body)

    const card = await prisma.promoCard.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl ?? null,
        active: data.active,
        displayOrder: data.displayOrder,
        backgroundColor: data.backgroundColor ?? null,
        textColor: data.textColor ?? null,
        autoPlay: data.autoPlay,
        slideInterval: data.slideInterval,
        linkEnabled: data.linkEnabled,
        linkUrl: data.linkUrl ?? null,
        placement: data.placement,
        comprarSlot: data.comprarSlot ?? null,
      },
      include: {
        media: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    })

    return NextResponse.json(card)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Card não encontrado' },
        { status: 404 }
      )
    }

    console.error('Erro ao atualizar card:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar card' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar card
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    await prisma.promoCard.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Card não encontrado' },
        { status: 404 }
      )
    }

    console.error('Erro ao deletar card:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar card' },
      { status: 500 }
    )
  }
}
