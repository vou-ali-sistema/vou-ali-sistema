import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Apaga TODAS as cortesias e seus itens (uso administrativo)
export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const result = await prisma.$transaction(async (tx) => {
      const items = await tx.courtesyItem.deleteMany({})
      const cortesias = await tx.courtesy.deleteMany({})
      return { itemsDeleted: items.count, courtesiesDeleted: cortesias.count }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Erro ao limpar cortesias:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar cortesias', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

