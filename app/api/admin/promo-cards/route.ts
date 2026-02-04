import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const promoCardSchema = z.object({
  title: z.string().optional().transform(val => val?.trim() || 'Apoiador'),
  content: z.string().optional().transform(val => val?.trim() || '—'),
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
  placement: z.enum(['HOME', 'COMPRAR', 'BOTH', 'APOIO']).default('BOTH'),
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
}).superRefine((data, ctx) => {
  if (data.placement === 'APOIO' && !data.imageUrl) {
    ctx.addIssue({ code: 'custom', message: 'Logo é obrigatório', path: ['imageUrl'] })
  }
})

// GET - Listar todos os cards
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where = activeOnly ? { active: true } : {}

    // Otimizar: não carregar mídias aqui (são carregadas sob demanda quando necessário)
    // Isso reduz drasticamente o tamanho da resposta e melhora performance
    const cards = await prisma.promoCard.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        active: true,
        displayOrder: true,
        backgroundColor: true,
        textColor: true,
        autoPlay: true,
        slideInterval: true,
        linkEnabled: true,
        linkUrl: true,
        placement: true,
        comprarSlot: true,
        createdAt: true,
        updatedAt: true,
        // Não incluir media aqui - será carregada sob demanda quando o card for editado
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Garantir que campos novos tenham valores padrão para compatibilidade
    // Adicionar media como array vazio (será carregado sob demanda quando necessário)
    const cardsWithDefaults = cards.map(card => ({
      ...card,
      autoPlay: card.autoPlay ?? true,
      slideInterval: card.slideInterval ?? 5000,
      linkEnabled: card.linkEnabled ?? true,
      linkUrl: card.linkUrl ?? null,
      placement: card.placement ?? 'BOTH',
      comprarSlot: card.comprarSlot ?? null,
      media: [], // Array vazio - mídias são carregadas sob demanda via /api/admin/promo-cards/[id]/media
      // Garantir que datas sejam serializadas corretamente
      createdAt: card.createdAt instanceof Date ? card.createdAt.toISOString() : card.createdAt,
      updatedAt: card.updatedAt instanceof Date ? card.updatedAt.toISOString() : card.updatedAt,
    }))

    return NextResponse.json(cardsWithDefaults)
  } catch (error) {
    console.error('Erro ao buscar cards:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cards', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST - Criar novo card
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = promoCardSchema.parse(body)

    const card = await prisma.promoCard.create({
      data: {
        title: data.title || 'Apoiador',
        content: data.content || '—',
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

    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar card:', error)
    return NextResponse.json(
      { error: 'Erro ao criar card' },
      { status: 500 }
    )
  }
}
