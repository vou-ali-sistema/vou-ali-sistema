import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    await prisma.financeEntry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao deletar lançamento:', error)
    return NextResponse.json({ error: 'Erro ao deletar lançamento' }, { status: 500 })
  }
}

