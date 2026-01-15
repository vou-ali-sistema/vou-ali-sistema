import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getStats() {
  try {
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
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDENTE' } }),
      prisma.order.count({ where: { status: 'PAGO' } }),
      prisma.order.count({ where: { status: 'RETIRADO' } }),
      prisma.order.count({ where: { status: 'CANCELADO' } }),
      prisma.courtesy.count(),
      prisma.courtesy.count({ where: { status: 'ATIVA' } }),
      prisma.courtesy.count({ where: { status: 'RETIRADA' } }),
      prisma.order.aggregate({
        where: { status: 'PAGO' },
        _sum: {
          totalValueCents: true,
        }
      }),
    ])

    const receitaTotal = (receitaTotalCents._sum.totalValueCents || 0) / 100

    return {
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
      receitaTotal,
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return null
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  const stats = await getStats()

  if (!stats) {
    return <div>Erro ao carregar estatísticas</div>
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
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-900 text-white rounded-lg hover:from-green-700 hover:to-blue-950 font-semibold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Página de Compra
          </Link>
        </div>
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
          <h3 className="text-sm font-medium mb-2 opacity-90">Receita Total</h3>
          <p className="text-3xl font-bold">
            R$ {stats.receitaTotal.toFixed(2).replace('.', ',')}
          </p>
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
          </div>
        </div>
      </div>
    </div>
  )
}

