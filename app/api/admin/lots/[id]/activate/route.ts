import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    // Usar transação para garantir que só um lote fique ativo
    const result = await prisma.$transaction(async (tx) => {
      // Desativar todos os lotes
      await tx.lot.updateMany({
        where: { active: true },
        data: { active: false },
      })

      // Ativar o lote solicitado
      const activatedLot = await tx.lot.update({
        where: { id },
        data: { active: true },
      })

      const activeCount = await tx.lot.count({ where: { active: true } })
      return { activatedLot, activeCount }
    })

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('Erro ao ativar lote:', error)
    return NextResponse.json(
      { error: 'Erro ao ativar lote' },
      { status: 500 }
    )
  }
}

