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
    const wherePaidOrDeliveredOrders = { ...whereActiveOrders, status: { in: ['PAGO', 'RETIRADO'] } } as any
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
      orderItemsAbadaAgg,
      orderItemsPulseiraAgg,
      courtesyItemsAbadaAgg,
      courtesyItemsPulseiraAgg,
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
        // Receita = pedidos pagos + retirados (retirado também conta como receita)
        where: { ...whereActiveOrders, status: { in: ['PAGO', 'RETIRADO'] } as any },
        _sum: {
          totalValueCents: true,
        }
      }),
      prisma.courtesyItem.groupBy({
        by: ['itemType'],
        where: courtesyWhereAtivasOuRetiradas,
        _sum: { quantity: true },
      }),
      prisma.orderItem.aggregate({
        where: { itemType: 'ABADA', order: wherePaidOrDeliveredOrders },
        _sum: { quantity: true, deliveredQuantity: true },
      }),
      prisma.orderItem.aggregate({
        where: { itemType: 'PULSEIRA_EXTRA', order: wherePaidOrDeliveredOrders },
        _sum: { quantity: true, deliveredQuantity: true },
      }),
      prisma.courtesyItem.aggregate({
        where: { itemType: 'ABADA', ...courtesyWhereAtivasOuRetiradas },
        _sum: { quantity: true, deliveredQuantity: true },
      }),
      prisma.courtesyItem.aggregate({
        where: { itemType: 'PULSEIRA_EXTRA', ...courtesyWhereAtivasOuRetiradas },
        _sum: { quantity: true, deliveredQuantity: true },
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

    const producedAbadas = activeLot?.abadaProducedQty ?? 0
    const producedPulseiras = activeLot?.pulseiraProducedQty ?? 0

    const soldAbadas = orderItemsAbadaAgg._sum.quantity ?? 0
    const soldPulseiras = orderItemsPulseiraAgg._sum.quantity ?? 0
    const deliveredAbadasOrders = orderItemsAbadaAgg._sum.deliveredQuantity ?? 0
    const deliveredPulseirasOrders = orderItemsPulseiraAgg._sum.deliveredQuantity ?? 0

    const courtesyAbadas = courtesyItemsAbadaAgg._sum.quantity ?? 0
    const courtesyPulseiras = courtesyItemsPulseiraAgg._sum.quantity ?? 0
    const deliveredAbadasCourtesies = courtesyItemsAbadaAgg._sum.deliveredQuantity ?? 0
    const deliveredPulseirasCourtesies = courtesyItemsPulseiraAgg._sum.deliveredQuantity ?? 0

    const committedAbadas = soldAbadas + courtesyAbadas
    const committedPulseiras = soldPulseiras + courtesyPulseiras

    const deliveredAbadas = deliveredAbadasOrders + deliveredAbadasCourtesies
    const deliveredPulseiras = deliveredPulseirasOrders + deliveredPulseirasCourtesies

    const toDeliverAbadas = Math.max(0, committedAbadas - deliveredAbadas)
    const toDeliverPulseiras = Math.max(0, committedPulseiras - deliveredPulseiras)

    const remainingAbadas = producedAbadas - committedAbadas
    const remainingPulseiras = producedPulseiras - committedPulseiras

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
        abadas: producedAbadas,
        pulseiras: producedPulseiras,
        committed: {
          abadas: committedAbadas,
          pulseiras: committedPulseiras,
        },
        delivered: {
          abadas: deliveredAbadas,
          pulseiras: deliveredPulseiras,
        },
        toDeliver: {
          abadas: toDeliverAbadas,
          pulseiras: toDeliverPulseiras,
        },
        remaining: {
          abadas: remainingAbadas,
          pulseiras: remainingPulseiras,
        },
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
