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

    // Buscar cards - versão simplificada e robusta
    let cards
    try {
      cards = await prisma.promoCard.findMany({
        where,
        include: {
          media: {
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      })
    } catch (prismaError: any) {
      console.error('Erro na query do Prisma:', {
        message: prismaError?.message,
        code: prismaError?.code,
        meta: prismaError?.meta,
      })
      // Retornar array vazio em caso de erro do Prisma para não quebrar a página
      return NextResponse.json([])
    }

    // Se não houver cards, retornar array vazio
    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json([])
    }

    // Garantir que campos novos tenham valores padrão para compatibilidade
    // Versão simplificada - usar spread e apenas ajustar campos necessários
    const cardsWithDefaults = cards.map(card => {
      // Usar spread operator e apenas ajustar campos que podem ser null/undefined
      const result: any = {
        ...card,
        autoPlay: card.autoPlay ?? true,
        slideInterval: card.slideInterval ?? 5000,
        linkEnabled: card.linkEnabled ?? true,
        linkUrl: card.linkUrl ?? null,
        placement: card.placement ?? 'BOTH',
        comprarSlot: card.comprarSlot ?? null,
        media: Array.isArray(card.media) ? card.media : [],
      }
      
      // Garantir serialização de datas
      if (result.createdAt instanceof Date) {
        result.createdAt = result.createdAt.toISOString()
      }
      if (result.updatedAt instanceof Date) {
        result.updatedAt = result.updatedAt.toISOString()
      }
      
      // Serializar mídias se necessário
      if (Array.isArray(result.media) && result.media.length > 0) {
        result.media = result.media.map((m: any) => ({
          ...m,
          createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
        }))
      }
      
      return result
    })

    return NextResponse.json(cardsWithDefaults)
  } catch (error) {
    console.error('Erro ao buscar cards:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Em caso de erro, retornar array vazio para não quebrar a página
    // Logs detalhados apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', errorStack)
    }
    
    // Retornar array vazio em vez de erro 500 para permitir que a página carregue
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
