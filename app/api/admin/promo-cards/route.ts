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

    // Buscar cards com mídias - método original que funcionava
    // Adicionar try-catch na query para capturar erros do Prisma
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
    } catch (prismaError) {
      console.error('Erro na query do Prisma:', prismaError)
      throw new Error(`Erro ao buscar cards do banco: ${prismaError instanceof Error ? prismaError.message : String(prismaError)}`)
    }

    // Garantir que campos novos tenham valores padrão para compatibilidade
    // Serializar explicitamente para evitar problemas
    const cardsWithDefaults = cards.map(card => {
      try {
        return {
          id: String(card.id),
          title: String(card.title || ''),
          content: String(card.content || ''),
          imageUrl: card.imageUrl ? String(card.imageUrl) : null,
          active: Boolean(card.active),
          displayOrder: Number(card.displayOrder) || 0,
          backgroundColor: card.backgroundColor ? String(card.backgroundColor) : null,
          textColor: card.textColor ? String(card.textColor) : null,
          autoPlay: card.autoPlay ?? true,
          slideInterval: Number(card.slideInterval) || 5000,
          linkEnabled: card.linkEnabled ?? true,
          linkUrl: card.linkUrl ? String(card.linkUrl) : null,
          placement: (card.placement || 'BOTH') as 'HOME' | 'COMPRAR' | 'BOTH' | 'APOIO',
          comprarSlot: card.comprarSlot ? (card.comprarSlot as 'TOP' | 'BOTTOM') : null,
          createdAt: card.createdAt instanceof Date ? card.createdAt.toISOString() : String(card.createdAt),
          updatedAt: card.updatedAt instanceof Date ? card.updatedAt.toISOString() : String(card.updatedAt),
          media: Array.isArray(card.media) ? card.media.map(m => {
            try {
              return {
                id: String(m.id || ''),
                mediaUrl: String(m.mediaUrl || ''),
                mediaType: String(m.mediaType || 'image'),
                displayOrder: Number(m.displayOrder) || 0,
                createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : (m.createdAt ? String(m.createdAt) : new Date().toISOString()),
              }
            } catch (mediaError) {
              console.error('Erro ao serializar media:', m.id, mediaError)
              return {
                id: String(m.id || ''),
                mediaUrl: String(m.mediaUrl || ''),
                mediaType: 'image',
                displayOrder: 0,
                createdAt: new Date().toISOString(),
              }
            }
          }) : [],
        }
      } catch (cardError) {
        console.error('Erro ao serializar card:', card.id, cardError)
        // Retornar card básico em caso de erro
        return {
          id: String(card.id),
          title: String(card.title || ''),
          content: String(card.content || ''),
          imageUrl: null,
          active: Boolean(card.active),
          displayOrder: 0,
          backgroundColor: null,
          textColor: null,
          autoPlay: true,
          slideInterval: 5000,
          linkEnabled: true,
          linkUrl: null,
          placement: 'BOTH' as const,
          comprarSlot: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          media: [],
        }
      }
    })

    return NextResponse.json(cardsWithDefaults)
  } catch (error) {
    console.error('Erro ao buscar cards:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        error: 'Erro ao buscar cards', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
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
