import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Este endpoint depende de headers/cookies (NextAuth), então não pode ser pré-renderizado.
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const whereActiveOrders = { archivedAt: null as any }
    const courtesyWhereAtivasOuRetiradas = { courtesy: { status: { in: ['ATIVA', 'RETIRADA'] } } } as any
    const [
      totalOrders,
      ordersPendentes,
      ordersPagos,
      ordersRetirados,
      ordersCancelados,
      totalCourtesies,
      courtesiesAtivas,
      courtesiesRetiradas,
      receitaTotalCents,
      courtesyItemsByType,
      activeLot,
    ] = await Promise.all([
      prisma.order.count({ where: whereActiveOrders }),
      prisma.order.count({ where: { ...whereActiveOrders, status: 'PENDENTE' } }),
      prisma.order.count({ where: { ...whereActiveOrders, status: 'PAGO' } }),
      prisma.order.count({ where: { ...whereActiveOrders, status: 'RETIRADO' } }),
      prisma.order.count({ where: { ...whereActiveOrders, status: 'CANCELADO' } }),
      prisma.courtesy.count(),
      prisma.courtesy.count({ where: { status: 'ATIVA' } }),
      prisma.courtesy.count({ where: { status: 'RETIRADA' } }),
      prisma.order.aggregate({
        where: { ...whereActiveOrders, status: 'PAGO' },
        _sum: {
          totalValueCents: true,
        }
      }),
      prisma.courtesyItem.groupBy({
        by: ['itemType'],
        where: courtesyWhereAtivasOuRetiradas,
        _sum: { quantity: true },
      }),
      prisma.lot.findFirst({
        where: { active: true },
        select: { id: true, name: true, abadaProducedQty: true, pulseiraProducedQty: true },
      }),
    ])

    const receitaTotal = (receitaTotalCents._sum.totalValueCents || 0) / 100
    const courtesyByType = {
      ABADA: 0,
      PULSEIRA_EXTRA: 0,
    }
    for (const row of courtesyItemsByType) {
      const qty = row._sum.quantity || 0
      if (row.itemType === 'ABADA') courtesyByType.ABADA = qty
      if (row.itemType === 'PULSEIRA_EXTRA') courtesyByType.PULSEIRA_EXTRA = qty
    }

    return NextResponse.json({
      orders: {
        total: totalOrders,
        pendentes: ordersPendentes,
        pagos: ordersPagos,
        retirados: ordersRetirados,
        cancelados: ordersCancelados,
      },
      courtesies: {
        total: totalCourtesies,
        ativas: courtesiesAtivas,
        retiradas: courtesiesRetiradas,
      },
      courtesiesByItem: courtesyByType,
      production: {
        activeLotName: activeLot?.name || null,
        abadas: activeLot?.abadaProducedQty ?? 0,
        pulseiras: activeLot?.pulseiraProducedQty ?? 0,
      },
      receitaTotal,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
