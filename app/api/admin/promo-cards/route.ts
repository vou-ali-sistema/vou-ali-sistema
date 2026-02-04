import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
// Resposta 100% serializável (apenas primitivos/strings) para evitar 500 ao serializar JSON
function serializeCard(card: {
  id: string
  title: string | null
  content: string | null
  imageUrl: string | null
  active: boolean
  displayOrder: number
  backgroundColor: string | null
  textColor: string | null
  autoPlay?: boolean | null
  slideInterval?: number | null
  linkEnabled?: boolean | null
  linkUrl?: string | null
  placement?: string | null
  comprarSlot?: string | null
  createdAt: Date
  updatedAt: Date
  media?: Array<{ id: string; mediaUrl: string; mediaType: string; displayOrder: number; createdAt?: Date }>
}) {
  return {
    id: String(card.id),
    title: String(card.title ?? ''),
    content: String(card.content ?? ''),
    imageUrl: card.imageUrl != null ? String(card.imageUrl) : null,
    active: Boolean(card.active),
    displayOrder: Number(card.displayOrder) ?? 0,
    backgroundColor: card.backgroundColor != null ? String(card.backgroundColor) : null,
    textColor: card.textColor != null ? String(card.textColor) : null,
    autoPlay: card.autoPlay ?? true,
    slideInterval: Number(card.slideInterval) ?? 5000,
    linkEnabled: card.linkEnabled ?? true,
    linkUrl: card.linkUrl != null ? String(card.linkUrl) : null,
    placement: (card.placement ?? 'BOTH') as 'HOME' | 'COMPRAR' | 'BOTH' | 'APOIO',
    comprarSlot: card.comprarSlot != null ? (card.comprarSlot as 'TOP' | 'BOTTOM') : null,
    createdAt: card.createdAt instanceof Date ? card.createdAt.toISOString() : String(card.createdAt),
    updatedAt: card.updatedAt instanceof Date ? card.updatedAt.toISOString() : String(card.updatedAt),
    media: Array.isArray(card.media)
      ? card.media.map((m) => ({
          id: String(m.id),
          mediaUrl: String(m.mediaUrl),
          mediaType: String(m.mediaType ?? 'image'),
          displayOrder: Number(m.displayOrder) ?? 0,
          createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : (m.createdAt ? String(m.createdAt) : ''),
        }))
      : [],
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  } catch (_e) {
    return NextResponse.json({ error: 'Erro de autenticação' }, { status: 401 })
  }

  try {
    const activeOnly = new URL(request.url).searchParams.get('activeOnly') === 'true'
    const where = activeOnly ? { active: true } : {}

    const cards = await prisma.promoCard.findMany({
      where,
      include: {
        media: { orderBy: { displayOrder: 'asc' } },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    })

    const payload: ReturnType<typeof serializeCard>[] = []
    for (const card of cards) {
      try {
        payload.push(serializeCard(card))
      } catch (cardErr) {
        console.error('Erro ao serializar card', card.id, cardErr)
      }
    }
    return NextResponse.json(payload)
  } catch (e) {
    console.error('GET /api/admin/promo-cards error:', e)
    return NextResponse.json([])
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
