import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PedidosToolbar from './PedidosToolbar'
import DeleteOrderButton from './DeleteOrderButton'
import FilterStatus from './FilterStatus'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

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
    const statusParam = (params.status || '').trim()
    const archived = (params.archived || '').trim()

    const conditions: any[] = []

    if (archived !== '1') {
      conditions.push({ archivedAt: null })
    }

    const validStatuses = ['PENDENTE', 'PAGO', 'RETIRADO', 'CANCELADO']
    if (statusParam) {
      const cleanStatus = statusParam.toUpperCase()
      if (validStatuses.includes(cleanStatus)) {
        conditions.push({ status: cleanStatus })
      }
    }

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

    // Construir where clause - SEMPRE usar AND quando houver múltiplas condições
    let where: any = {}
    
    if (conditions.length === 0) {
      // Sem condições, mas ainda precisa filtrar arquivados se necessário
      if (archived !== '1') {
        where = { archivedAt: null }
      } else {
        where = {}
      }
    } else if (conditions.length === 1) {
      // Uma única condição, aplicar diretamente
      where = conditions[0]
    } else {
      where = { AND: conditions }
    }

    // Buscar pedidos e contagem total
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
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
        take: 1000, // Aumentar limite para suportar muitos pedidos
      }),
      prisma.order.count({ where }),
    ])

    return { orders, totalCount }
  } catch (error) {
    console.error('getOrders - Erro:', error)
    return { orders: [] as any[], totalCount: 0 }
  }
}

type SearchParams = { q?: string | string[]; status?: string | string[]; archived?: string | string[] }

export default async function PedidosPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const params: SearchParams = await (searchParams ?? Promise.resolve({}))
  
  // Extrair parâmetros com optional chaining e nullish coalescing (evita .toString() em undefined)
  const qVal = params?.q ?? null
  const statusVal = params?.status ?? null
  const archivedVal = params?.archived ?? null

  const qRaw = qVal == null ? undefined : Array.isArray(qVal) ? qVal[0] : qVal
  const statusRaw = statusVal == null ? undefined : Array.isArray(statusVal) ? statusVal[0] : statusVal
  const archivedRaw = archivedVal == null ? undefined : Array.isArray(archivedVal) ? archivedVal[0] : archivedVal

  const q = (qRaw && qRaw !== '' && qRaw !== 'undefined') ? String(qRaw).trim() : ''
  const status = (statusRaw && statusRaw !== '' && statusRaw !== 'undefined') ? String(statusRaw).trim() : ''
  const archived = (archivedRaw && archivedRaw !== '' && archivedRaw !== 'undefined') ? String(archivedRaw).trim() : ''

  const { orders, totalCount } = await getOrders({ q, status, archived })

  return (
    <div className="px-4 py-6">
      <FilterStatus />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Pedidos</h1>
          <p className="text-sm text-gray-600 mt-1">
            {totalCount > 0 ? (
              <>
                Mostrando <strong>{orders.length}</strong> de <strong>{totalCount}</strong> pedido{totalCount !== 1 ? 's' : ''}
                {status && (
                  <span> com status <strong>{status}</strong></span>
                )}
              </>
            ) : (
              'Nenhum pedido encontrado'
            )}
          </p>
        </div>
      </div>

      <PedidosToolbar q={q} status={status} archived={archived} />

      {/* Filtros aplicados - Link evita onClick em Server Component */}
      {(q || status) && (
        <div className="mb-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Filtros ativos:</strong>
            {status && <span className="ml-2">Status: <strong>{status}</strong></span>}
            {q && <span className="ml-2">Busca: <strong>{q}</strong></span>}
            <Link
              href="/admin/pedidos"
              className="ml-3 text-blue-600 hover:text-blue-800 underline text-xs"
            >
              Limpar filtros
            </Link>
          </p>
        </div>
      )}

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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-lg font-semibold">Nenhum pedido encontrado</p>
                  <p className="text-sm mt-1">
                    {status ? `Não há pedidos com status "${status}"` : 'Tente ajustar os filtros de busca'}
                  </p>
                </td>
              </tr>
            ) : (
              orders.map((order: any) => (
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
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
