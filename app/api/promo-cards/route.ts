import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET público - Listar apenas cards ativos
export async function GET(request: NextRequest) {
  try {
    const cards = await prisma.promoCard.findMany({
      where: { active: true },
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

    // Garantir que campos novos tenham valores padrão para compatibilidade
    const cardsWithDefaults = cards.map(card => ({
      ...card,
      linkEnabled: card.linkEnabled ?? true,
      linkUrl: card.linkUrl ?? null,
    }))

    return NextResponse.json(cardsWithDefaults)
  } catch (error) {
    console.error('Erro ao buscar cards públicos:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Erro ao buscar cards', details: errorMessage },
      { status: 500 }
    )
  }
}
