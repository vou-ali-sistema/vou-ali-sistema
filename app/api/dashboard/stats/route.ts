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
      financeIncomeAgg,
      financeExpenseAgg,
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
      prisma.financeEntry.aggregate({
        where: { type: 'INCOME' as any },
        _sum: { amountCents: true },
      }),
      prisma.financeEntry.aggregate({
        where: { type: 'EXPENSE' as any },
        _sum: { amountCents: true },
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
      prisma.lot.findMany({
        where: { active: true },
        select: { id: true, name: true, abadaProducedQty: true, pulseiraProducedQty: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const receitaVendasCents = receitaTotalCents._sum.totalValueCents || 0
    const entradasLancadasCents = financeIncomeAgg._sum.amountCents || 0
    const saidasLancadasCents = financeExpenseAgg._sum.amountCents || 0
    const receitaEmPosseCents = receitaVendasCents + entradasLancadasCents - saidasLancadasCents

    const receitaVendas = receitaVendasCents / 100
    const receitaEmPosse = receitaEmPosseCents / 100
    const courtesyByType = {
      ABADA: 0,
      PULSEIRA_EXTRA: 0,
    }
    for (const row of courtesyItemsByType) {
      const qty = row._sum.quantity || 0
      if (row.itemType === 'ABADA') courtesyByType.ABADA = qty
      if (row.itemType === 'PULSEIRA_EXTRA') courtesyByType.PULSEIRA_EXTRA = qty
    }

    const totalProducedAbadas = activeLot.reduce((sum, lot) => sum + (lot.abadaProducedQty ?? 0), 0)
    const totalProducedPulseiras = activeLot.reduce((sum, lot) => sum + (lot.pulseiraProducedQty ?? 0), 0)

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

    const remainingAbadas = totalProducedAbadas - committedAbadas
    const remainingPulseiras = totalProducedPulseiras - committedPulseiras

    // Estatísticas por lote individual
    const statsPorLote = await Promise.all(
      activeLot.map(async (lot) => {
        const orderItemsAbadaLote = await prisma.orderItem.aggregate({
          where: {
            itemType: 'ABADA',
            order: { ...wherePaidOrDeliveredOrders, lotId: lot.id },
          },
          _sum: { quantity: true, deliveredQuantity: true },
        })
        const orderItemsPulseiraLote = await prisma.orderItem.aggregate({
          where: {
            itemType: 'PULSEIRA_EXTRA',
            order: { ...wherePaidOrDeliveredOrders, lotId: lot.id },
          },
          _sum: { quantity: true, deliveredQuantity: true },
        })

        const soldAbadasLote = orderItemsAbadaLote._sum.quantity ?? 0
        const soldPulseirasLote = orderItemsPulseiraLote._sum.quantity ?? 0
        const deliveredAbadasOrdersLote = orderItemsAbadaLote._sum.deliveredQuantity ?? 0
        const deliveredPulseirasOrdersLote = orderItemsPulseiraLote._sum.deliveredQuantity ?? 0

        const committedAbadasLote = soldAbadasLote
        const committedPulseirasLote = soldPulseirasLote
        const deliveredAbadasLote = deliveredAbadasOrdersLote
        const deliveredPulseirasLote = deliveredPulseirasOrdersLote
        const toDeliverAbadasLote = Math.max(0, committedAbadasLote - deliveredAbadasLote)
        const toDeliverPulseirasLote = Math.max(0, committedPulseirasLote - deliveredPulseirasLote)
        const remainingAbadasLote = (lot.abadaProducedQty ?? 0) - committedAbadasLote
        const remainingPulseirasLote = (lot.pulseiraProducedQty ?? 0) - committedPulseirasLote

        return {
          id: lot.id,
          name: lot.name,
          producedAbadas: lot.abadaProducedQty ?? 0,
          producedPulseiras: lot.pulseiraProducedQty ?? 0,
          soldAbadas: soldAbadasLote,
          soldPulseiras: soldPulseirasLote,
          committedAbadas: committedAbadasLote,
          committedPulseiras: committedPulseirasLote,
          deliveredAbadas: deliveredAbadasLote,
          deliveredPulseiras: deliveredPulseirasLote,
          toDeliverAbadas: toDeliverAbadasLote,
          toDeliverPulseiras: toDeliverPulseirasLote,
          remainingAbadas: remainingAbadasLote,
          remainingPulseiras: remainingPulseirasLote,
        }
      })
    )

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
        activeLotName: activeLot.length > 0 ? (activeLot.length === 1 ? activeLot[0].name : `${activeLot.length} lotes ativos`) : null,
        abadas: totalProducedAbadas,
        pulseiras: totalProducedPulseiras,
        lots: statsPorLote,
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
      receitaVendas,
      receitaVendasCents,
      entradasLancadasCents,
      saidasLancadasCents,
      receitaEmPosse,
      receitaEmPosseCents,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
