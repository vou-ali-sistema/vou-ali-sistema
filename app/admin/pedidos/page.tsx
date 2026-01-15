import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getOrders() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return { orders }
  } catch {
    return { orders: [] as any[] }
  }
}

export default async function PedidosPage() {
  const { orders } = await getOrders()

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Pedidos</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-green-600">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-green-600 to-blue-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Itens
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order: any) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.id.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {order.customer.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                  R$ {(order.totalValueCents / 100).toFixed(2).replace('.', ',')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {order.items.length} item(ns)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="text-blue-600 hover:text-blue-900 font-semibold"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
