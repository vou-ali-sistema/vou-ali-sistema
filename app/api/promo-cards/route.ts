import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache por 60 segundos para melhorar performance (dados públicos que não mudam frequentemente)
export const revalidate = 60
export const runtime = 'nodejs'

// GET público - Listar apenas cards ativos
export async function GET(request: NextRequest) {
  try {
    const placement = request.nextUrl.searchParams.get('placement') // HOME | COMPRAR | APOIO

    const wherePlacement =
      placement === 'HOME'
        ? { in: ['HOME', 'BOTH'] as any }
        : placement === 'COMPRAR'
        ? { in: ['COMPRAR', 'BOTH'] as any }
        : placement === 'APOIO'
        ? { equals: 'APOIO' as any }
        : undefined

    const selectBase = {
      id: true,
      title: true,
      content: true,
      imageUrl: true,
      backgroundColor: true,
      textColor: true,
      autoPlay: true,
      slideInterval: true,
      linkEnabled: true,
      linkUrl: true,
      placement: true,
      comprarSlot: true,
      displayOrder: true,
      createdAt: true,
      updatedAt: true,
    } as const

    const selectWithMedia = {
      ...selectBase,
      media: {
        orderBy: { displayOrder: 'asc' as const },
        select: {
          id: true,
          mediaUrl: true,
          mediaType: true,
          displayOrder: true,
          createdAt: true,
        },
      },
    } as const

    const includeMedia = placement !== 'APOIO'

    const cards = await prisma.promoCard.findMany({
      where: {
        active: true,
        ...(wherePlacement ? { placement: wherePlacement } : {}),
      },
      select: includeMedia ? selectWithMedia : selectBase,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Garantir que campos novos tenham valores padrão para compatibilidade
    const cardsWithDefaults = cards.map(card => ({
      ...card,
      linkEnabled: card.linkEnabled ?? true,
      linkUrl: card.linkUrl ?? null,
      placement: card.placement ?? 'BOTH',
      comprarSlot: card.comprarSlot ?? null,
      media: 'media' in card ? (card.media ?? []) : [],
    }))

    return NextResponse.json(cardsWithDefaults, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar cards públicos:', error)
    // Retornar array vazio para a página não quebrar; dados públicos são não-críticos
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  }
}
