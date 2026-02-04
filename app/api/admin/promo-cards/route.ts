import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const promoCardSchema = z.object({
  title: z.string().optional().transform(val => val?.trim() || 'Apoiador'),
  content: z.string().optional().transform(val => val?.trim() || '—'),
  imageUrl: z.string().optional().or(z.literal('')).transform(val => {
    if (!val || val === '') return undefined
    if (val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://')) return val
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
    if (val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://')) return val
    return undefined
  }),
  placement: z.enum(['HOME', 'COMPRAR', 'BOTH', 'APOIO']).default('BOTH'),
  comprarSlot: z.enum(['TOP', 'BOTTOM']).optional().nullable().or(z.literal('')).transform((val) => (val ? val : undefined)),
}).superRefine((data, ctx) => {
  if (data.placement === 'APOIO' && !data.imageUrl) {
    ctx.addIssue({ code: 'custom', message: 'Logo é obrigatório', path: ['imageUrl'] })
  }
})

/** Serializa um card para JSON (apenas tipos seguros) */
function toPlainCard(card: {
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
    active: !!card.active,
    displayOrder: Number(card.displayOrder) || 0,
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
  let session: { user?: { email?: string } } | null = null
  try {
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    session = await getServerSession(authOptions)
  } catch (authErr) {
    console.error('promo-cards GET: auth error', authErr)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/prisma')
    const activeOnly = new URL(request.url).searchParams.get('activeOnly') === 'true'
    const where = activeOnly ? { active: true } : {}

    const cards = await prisma.promoCard.findMany({
      where,
      include: { media: { orderBy: { displayOrder: 'asc' } } },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    })

    const payload: ReturnType<typeof toPlainCard>[] = []
    for (const card of cards) {
      try {
        payload.push(toPlainCard(card))
      } catch (_) {
        // ignora card com erro
      }
    }
    return NextResponse.json(payload)
  } catch (err) {
    console.error('promo-cards GET:', err)
    return NextResponse.json([])
  }
}

// POST - Criar novo card
export async function POST(request: NextRequest) {
  try {
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
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
      include: { media: { orderBy: { displayOrder: 'asc' } } },
    })

    return NextResponse.json(toPlainCard(card), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('promo-cards POST:', error)
    return NextResponse.json({ error: 'Erro ao criar card' }, { status: 500 })
  }
}
