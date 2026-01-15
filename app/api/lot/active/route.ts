import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const activeLot = await prisma.lot.findFirst({
      where: { active: true },
      select: {
        id: true,
        name: true,
        abadaPriceCents: true,
        pulseiraPriceCents: true,
      }
    })

    if (!activeLot) {
      return NextResponse.json(
        { error: 'Nenhum lote ativo encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(activeLot, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('Erro ao buscar lote ativo:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar lote ativo' },
      { status: 500 }
    )
  }
}
