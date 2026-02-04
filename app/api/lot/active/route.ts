import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache por 30 segundos (lote ativo pode mudar, mas não constantemente)
export const revalidate = 30
export const runtime = 'nodejs'

export async function GET() {
  try {
    const activeLot = await prisma.lot.findFirst({
      where: { active: true },
      select: {
        id: true,
        name: true,
        abadaPriceCents: true,
        pulseiraPriceCents: true,
        abadaProducedQty: true,
        pulseiraProducedQty: true,
      }
    })

    if (!activeLot) {
      return NextResponse.json(
        { error: 'Nenhum lote ativo encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(activeLot, {
      headers: { 
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar lote ativo:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar lote ativo' },
      { status: 500 }
    )
  }
}
