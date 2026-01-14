import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Usar transação para garantir que só um lote fique ativo
    const lot = await prisma.$transaction(async (tx) => {
      // Desativar todos os lotes
      await tx.lot.updateMany({
        where: { active: true },
        data: { active: false },
      })

      // Ativar o lote solicitado
      const activatedLot = await tx.lot.update({
        where: { id: params.id },
        data: { active: true },
      })

      return activatedLot
    })

    return NextResponse.json(lot)
  } catch (error) {
    console.error('Erro ao ativar lote:', error)
    return NextResponse.json(
      { error: 'Erro ao ativar lote' },
      { status: 500 }
    )
  }
}

