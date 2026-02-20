import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import FinanceiroWidget from './FinanceiroWidget'
import CompraToggle from './CompraToggle'
import MercadoPagoTaxa from './MercadoPagoTaxa'
import EnsureTrocasUserButton from './EnsureTrocasUserButton'
import { isPurchaseEnabled, getMercadoPagoTaxaPercent } from '@/lib/settings'

export const dynamic = 'force-dynamic'

async function getStats() {
  try {
    const whereActiveOrders = { archivedAt: null as any }
    const courtesyWhereAtivasOuRetiradas = { courtesy: { status: { in: ['ATIVA', 'RETIRADA'] } } } as any
    const wherePaidOrDeliveredOrders = { ...whereActiveOrders, status: { in: ['PAGO', 'RETIRADO'] } } as any
    const purchaseEnabled = await isPurchaseEnabled()

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

    const receitaVendasBrutaCents = receitaTotalCents._sum.totalValueCents || 0
    // Desconto configurável do Mercado Pago
    const taxaMercadoPagoPercent = await getMercadoPagoTaxaPercent()
    const taxaMercadoPagoDecimal = taxaMercadoPagoPercent / 100
    const descontoMercadoPagoCents = Math.round(receitaVendasBrutaCents * taxaMercadoPagoDecimal)
    const receitaVendasCents = receitaVendasBrutaCents - descontoMercadoPagoCents
    
    const entradasLancadasCents = financeIncomeAgg._sum.amountCents || 0
    const saidasLancadasCents = financeExpenseAgg._sum.amountCents || 0
    const receitaEmPosseCents = receitaVendasCents + entradasLancadasCents - saidasLancadasCents

    const receitaVendasBruta = receitaVendasBrutaCents / 100
    const receitaVendas = receitaVendasCents / 100
    const receitaEmPosse = receitaEmPosseCents / 100
    const descontoMercadoPago = descontoMercadoPagoCents / 100
    const courtesyByType = {
      ABADA: 0,
      PULSEIRA_EXTRA: 0,
    }
    for (const row of courtesyItemsByType) {
      const qty = row._sum.quantity || 0
      if (row.itemType === 'ABADA') courtesyByType.ABADA = qty
      if (row.itemType === 'PULSEIRA_EXTRA') courtesyByType.PULSEIRA_EXTRA = qty
    }

    // Agregar todos os lotes ativos
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

    // Estatísticas por lote individual (por item: usa OrderItem.lotId; se null, usa order.lotId para pedidos antigos)
    const statsPorLote = await Promise.all(
      activeLot.map(async (lot) => {
        const orderItemsAbadaLote = await prisma.orderItem.aggregate({
          where: {
            itemType: 'ABADA',
            order: wherePaidOrDeliveredOrders,
            OR: [
              { lotId: lot.id },
              { lotId: null, order: { ...wherePaidOrDeliveredOrders, lotId: lot.id } },
            ],
          },
          _sum: { quantity: true, deliveredQuantity: true },
        })
        const orderItemsPulseiraLote = await prisma.orderItem.aggregate({
          where: {
            itemType: 'PULSEIRA_EXTRA',
            order: wherePaidOrDeliveredOrders,
            OR: [
              { lotId: lot.id },
              { lotId: null, order: { ...wherePaidOrDeliveredOrders, lotId: lot.id } },
            ],
          },
          _sum: { quantity: true, deliveredQuantity: true },
        })
        // Cortesias não têm lotId, então não incluímos na contabilidade por lote individual
        // (só na contabilidade geral)
        const soldAbadasLote = orderItemsAbadaLote._sum.quantity ?? 0
        const soldPulseirasLote = orderItemsPulseiraLote._sum.quantity ?? 0
        const deliveredAbadasOrdersLote = orderItemsAbadaLote._sum.deliveredQuantity ?? 0
        const deliveredPulseirasOrdersLote = orderItemsPulseiraLote._sum.deliveredQuantity ?? 0

        const committedAbadasLote = soldAbadasLote // Sem cortesias por lote
        const committedPulseirasLote = soldPulseirasLote // Sem cortesias por lote
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

    return {
      orders: {
        total: totalOrders,
        pendentes: ordersPendentes,
        pagos: ordersPagos,
        retirados: ordersRetirados,
        cancelados: ordersCancelados,
      },
      purchaseEnabled,
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
      receitaVendasBruta,
      receitaVendasBrutaCents,
      receitaVendas,
      receitaVendasCents,
      descontoMercadoPago,
      descontoMercadoPagoCents,
      entradasLancadasCents,
      saidasLancadasCents,
      receitaEmPosse,
      receitaEmPosseCents,
      mercadoPagoTaxaPercent: taxaMercadoPagoPercent,
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return null
  }
}

export default async function DashboardPage() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      redirect('/admin/login')
    }

    const stats = await getStats()

    if (!stats) {
      return (
        <div className="px-4 py-6">
          <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-semibold">Erro ao carregar estatísticas.</p>
            <p className="text-sm mt-2">Tente recarregar a página. Se persistir, verifique a conexão com o banco.</p>
          </div>
        </div>
      )
    }

    return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Visão geral do sistema</p>
          </div>
          <Link
            href="/comprar"
            target="_blank"
            aria-disabled={!stats.purchaseEnabled}
            className={[
              'px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2',
              stats.purchaseEnabled
                ? 'bg-gradient-to-r from-green-600 to-blue-900 text-white hover:from-green-700 hover:to-blue-950 transform hover:scale-105'
                : 'bg-gray-200 text-gray-700 border border-gray-300 cursor-not-allowed pointer-events-none',
            ].join(' ')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {stats.purchaseEnabled ? 'Página de Compra' : 'Página de Compra (bloqueada)'}
          </Link>
        </div>
      </div>

      <div className="mb-8 space-y-6">
        <CompraToggle initialEnabled={stats.purchaseEnabled} />
        <MercadoPagoTaxa initialTaxa={stats.mercadoPagoTaxaPercent ?? 9.0} />
        {(session?.user as { role?: string })?.role === 'ADMIN' && <EnsureTrocasUserButton />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl shadow-lg p-6 text-white border-2 border-yellow-400">
          <h3 className="text-sm font-medium mb-2 opacity-90">Total de Pedidos</h3>
          <p className="text-4xl font-bold">{stats.orders.total}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-lg p-6 text-blue-900 border-2 border-green-600">
          <h3 className="text-sm font-medium mb-2">Pedidos Pendentes</h3>
          <p className="text-4xl font-bold">{stats.orders.pendentes}</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white border-2 border-yellow-400">
          <h3 className="text-sm font-medium mb-2 opacity-90">Pedidos Pagos</h3>
          <p className="text-4xl font-bold">{stats.orders.pagos}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400 rounded-xl shadow-lg p-6 text-white border-2 border-white">
          <h3 className="text-sm font-medium mb-2 opacity-90">Receita Líquida (em posse)</h3>
          <p className="text-3xl font-bold">
            R$ {stats.receitaEmPosse.toFixed(2).replace('.', ',')}
          </p>
          <div className="mt-3 text-xs opacity-95 space-y-1">
            <div className="flex justify-between gap-3">
              <span>Vendas brutas:</span>
              <span className="font-semibold">R$ {stats.receitaVendasBruta.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Desconto MP ({stats.mercadoPagoTaxaPercent?.toFixed(2) ?? '9.00'}%):</span>
              <span className="font-semibold text-red-200">- R$ {stats.descontoMercadoPago.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-white/30 pt-1">
              <span>Vendas líquidas:</span>
              <span className="font-semibold">R$ {stats.receitaVendas.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Entradas:</span>
              <span className="font-semibold">R$ {(stats.entradasLancadasCents / 100).toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Saídas:</span>
              <span className="font-semibold">R$ {(stats.saidasLancadasCents / 100).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-600">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Pedidos Retirados</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
              <span className="text-gray-700 font-medium">Total Retirado:</span>
              <span className="font-bold text-green-600 text-lg">{stats.orders.retirados}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-600">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Pedidos Cancelados</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
              <span className="text-gray-700 font-medium">Total Cancelado:</span>
              <span className="font-bold text-red-600 text-lg">{stats.orders.cancelados}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-900">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Cortesias</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span className="text-gray-700 font-medium">Total:</span>
              <span className="font-bold text-blue-900 text-lg">{stats.courtesies.total}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg">
              <span className="text-gray-700 font-medium">Ativas:</span>
              <span className="font-bold text-yellow-600 text-lg">{stats.courtesies.ativas}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
              <span className="text-gray-700 font-medium">Retiradas:</span>
              <span className="font-bold text-green-600 text-lg">{stats.courtesies.retiradas}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <p className="text-sm font-semibold text-gray-800 mb-2">Cortesias dadas (itens)</p>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg mb-2">
                <span className="text-gray-700 font-medium">Abadá:</span>
                <span className="font-bold text-gray-900 text-lg">{stats.courtesiesByItem.ABADA}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Pulseira Extra:</span>
                <span className="font-bold text-gray-900 text-lg">{stats.courtesiesByItem.PULSEIRA_EXTRA}</span>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <p className="text-sm font-semibold text-gray-800 mb-2">Contabilidade Geral (todos os lotes)</p>
              <p className="text-xs text-gray-600 mb-2">
                {stats.production.activeLotName || 'Nenhum lote ativo'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Abadá</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Produzidos:</span><span className="font-bold">{stats.production.abadas}</span></div>
                    <div className="flex justify-between"><span>Cortesias:</span><span className="font-bold">{stats.courtesiesByItem.ABADA}</span></div>
                    <div className="flex justify-between"><span>Comprometidos:</span><span className="font-bold">{stats.production.committed.abadas}</span></div>
                    <div className="flex justify-between"><span>Entregues:</span><span className="font-bold">{stats.production.delivered.abadas}</span></div>
                    <div className="flex justify-between"><span>A entregar:</span><span className="font-bold">{stats.production.toDeliver.abadas}</span></div>
                    <div className="flex justify-between">
                      <span>Restantes:</span>
                      <span className={`font-bold ${stats.production.remaining.abadas < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {stats.production.remaining.abadas}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Pulseira Extra</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Produzidas:</span><span className="font-bold">{stats.production.pulseiras}</span></div>
                    <div className="flex justify-between"><span>Cortesias:</span><span className="font-bold">{stats.courtesiesByItem.PULSEIRA_EXTRA}</span></div>
                    <div className="flex justify-between"><span>Comprometidas:</span><span className="font-bold">{stats.production.committed.pulseiras}</span></div>
                    <div className="flex justify-between"><span>Entregues:</span><span className="font-bold">{stats.production.delivered.pulseiras}</span></div>
                    <div className="flex justify-between"><span>A entregar:</span><span className="font-bold">{stats.production.toDeliver.pulseiras}</span></div>
                    <div className="flex justify-between">
                      <span>Restantes:</span>
                      <span className={`font-bold ${stats.production.remaining.pulseiras < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {stats.production.remaining.pulseiras}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <FinanceiroWidget receitaVendasCents={stats.receitaVendasCents} receitaVendasBrutaCents={stats.receitaVendasBrutaCents} descontoMercadoPagoCents={stats.descontoMercadoPagoCents} mercadoPagoTaxaPercent={stats.mercadoPagoTaxaPercent ?? 5.0} />
        </div>
      </div>

      {/* Seção de Lotes Abertos */}
      {stats.production.lots && stats.production.lots.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Lotes Abertos - Contabilidade Individual</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.production.lots.map((lot) => (
              <div key={lot.id} className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-4">{lot.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 mb-2">Abadá</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>Produzidos:</span><span className="font-bold">{lot.producedAbadas}</span></div>
                      <div className="flex justify-between"><span>Vendidos:</span><span className="font-bold">{lot.soldAbadas}</span></div>
                      <div className="flex justify-between"><span>Comprometidos:</span><span className="font-bold">{lot.committedAbadas}</span></div>
                      <div className="flex justify-between"><span>Entregues:</span><span className="font-bold">{lot.deliveredAbadas}</span></div>
                      <div className="flex justify-between"><span>A entregar:</span><span className="font-bold">{lot.toDeliverAbadas}</span></div>
                      <div className="flex justify-between">
                        <span>Restantes:</span>
                        <span className={`font-bold ${lot.remainingAbadas < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {lot.remainingAbadas}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 mb-2">Pulseira Extra</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>Produzidas:</span><span className="font-bold">{lot.producedPulseiras}</span></div>
                      <div className="flex justify-between"><span>Vendidas:</span><span className="font-bold">{lot.soldPulseiras}</span></div>
                      <div className="flex justify-between"><span>Comprometidas:</span><span className="font-bold">{lot.committedPulseiras}</span></div>
                      <div className="flex justify-between"><span>Entregues:</span><span className="font-bold">{lot.deliveredPulseiras}</span></div>
                      <div className="flex justify-between"><span>A entregar:</span><span className="font-bold">{lot.toDeliverPulseiras}</span></div>
                      <div className="flex justify-between">
                        <span>Restantes:</span>
                        <span className={`font-bold ${lot.remainingPulseiras < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {lot.remainingPulseiras}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
  } catch (err) {
    console.error('DashboardPage error:', err)
    return (
      <div className="px-4 py-6">
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 text-red-900">
          <p className="font-semibold">Erro ao carregar o dashboard.</p>
          <p className="text-sm mt-2">Tente recarregar a página ou faça logout e login novamente.</p>
        </div>
      </div>
    )
  }
}

