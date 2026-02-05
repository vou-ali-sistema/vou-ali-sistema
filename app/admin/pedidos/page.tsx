import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PedidosToolbar from './PedidosToolbar'
import DeleteOrderButton from './DeleteOrderButton'

export const dynamic = 'force-dynamic'

function paymentStatusLabel(status?: string | null) {
  switch (status) {
    case 'APPROVED':
      return 'APROVADO'
    case 'REJECTED':
      return 'REJEITADO'
    case 'REFUNDED':
      return 'REEMBOLSADO'
    case 'PENDING':
      return 'PENDENTE'
    default:
      return '-'
  }
}

async function getOrders(params: { q?: string; status?: string; archived?: string }) {
  try {
    const q = (params.q || '').trim()
    const status = (params.status || '').trim()
    const archived = (params.archived || '').trim()

    // Construir condições de forma explícita
    const conditions: any[] = []

    // Por padrão, esconder arquivados
    if (archived !== '1') {
      conditions.push({ archivedAt: null })
    }

    // Aplicar filtro de status
    if (status) {
      conditions.push({ status })
    }

    // Aplicar busca
    if (q) {
      conditions.push({
        OR: [
          { id: { contains: q, mode: 'insensitive' } },
          { externalReference: { contains: q, mode: 'insensitive' } },
          { mpPaymentId: { contains: q, mode: 'insensitive' } },
          { mpPreferenceId: { contains: q, mode: 'insensitive' } },
          { customer: { name: { contains: q, mode: 'insensitive' } } },
          { customer: { phone: { contains: q, mode: 'insensitive' } } },
          { customer: { email: { contains: q, mode: 'insensitive' } } },
        ],
      })
    }

    // Construir where clause
    let where: any
    if (conditions.length === 0) {
      // Sem condições, mas ainda precisa filtrar arquivados se necessário
      where = archived !== '1' ? { archivedAt: null } : {}
    } else if (conditions.length === 1) {
      // Uma única condição, aplicar diretamente
      where = conditions[0]
    } else {
      // Múltiplas condições, usar AND
      where = { AND: conditions }
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        totalValueCents: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            itemType: true,
            quantity: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return { orders }
  } catch {
    return { orders: [] as any[] }
  }
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string; archived?: string }>
}) {
  const params = await (searchParams || Promise.resolve({}))
  const q = params.q || ''
  const status = params.status || ''
  const archived = params.archived || ''

  const { orders } = await getOrders({ q, status, archived })

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Pedidos</h1>
      </div>

      <PedidosToolbar q={q} status={status} archived={archived} />

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-green-600">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-green-600 to-blue-900">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                ID
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Pagamento
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Valor
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Itens
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Data
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order: any) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.id.substring(0, 8)}...
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {order.customer.name}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'PAGO' 
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'RETIRADO'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'PENDENTE'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {paymentStatusLabel(order.paymentStatus)}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                  R$ {(order.totalValueCents / 100).toFixed(2).replace('.', ',')}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {order.items.length} item(ns)
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="text-blue-600 hover:text-blue-900 font-semibold"
                    >
                      Ver
                    </Link>
                    {order.status === 'CANCELADO' && (
                      <DeleteOrderButton orderId={order.id} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
