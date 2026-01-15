import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Arquivar pedidos (para "limpar lista" entre eventos sem deletar histórico)
// Default: arquiva pedidos NÃO pendentes (PAGO/RETIRADO/CANCELADO) que não estão arquivados.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const includePendentes = body?.includePendentes === true
    const onlyStatus = typeof body?.status === 'string' ? body.status : null

    const where: any = { archivedAt: null }

    if (onlyStatus) {
      where.status = onlyStatus
    } else if (!includePendentes) {
      where.status = { in: ['PAGO', 'RETIRADO', 'CANCELADO'] }
    }

    const now = new Date()

    const result = await prisma.order.updateMany({
      where,
      data: { archivedAt: now },
    })

    return NextResponse.json({ ok: true, archivedCount: result.count })
  } catch (error) {
    console.error('Erro ao arquivar pedidos:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Erro ao arquivar pedidos', details: message },
      { status: 500 }
    )
  }
}

