import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  scope: z.enum(['ARCHIVED', 'ALL']),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Ação destrutiva: restringir para ADMIN
    const role = (session as any)?.user?.role
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas ADMIN pode executar esta ação' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { scope } = bodySchema.parse(body)

    if (scope === 'ALL') {
      const result = await prisma.$transaction(async (tx) => {
        const deletedItems = await tx.orderItem.deleteMany({})
        const deletedOrders = await tx.order.deleteMany({})
        return { deletedOrders, deletedItems }
      })

      return NextResponse.json({
        ok: true,
        scope,
        deletedOrders: result.deletedOrders.count,
        deletedItems: result.deletedItems.count,
      })
    }

    // ARCHIVED
    const archivedOrders = await prisma.order.findMany({
      where: { archivedAt: { not: null } },
      select: { id: true },
      take: 5000,
    })

    const ids = archivedOrders.map((o) => o.id)
    if (ids.length === 0) {
      return NextResponse.json({ ok: true, scope, deletedOrders: 0, deletedItems: 0 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const deletedItems = await tx.orderItem.deleteMany({
        where: { orderId: { in: ids } },
      })
      const deletedOrders = await tx.order.deleteMany({
        where: { id: { in: ids } },
      })
      return { deletedOrders, deletedItems }
    })

    return NextResponse.json({
      ok: true,
      scope,
      deletedOrders: result.deletedOrders.count,
      deletedItems: result.deletedItems.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Erro ao limpar pedidos:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Erro ao limpar pedidos', details: msg }, { status: 500 })
  }
}

