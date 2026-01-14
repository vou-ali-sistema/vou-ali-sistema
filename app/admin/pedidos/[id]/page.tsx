import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PedidoActions from './PedidoActions'

async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      customer: true,
      deliveredByUser: true,
      lot: true,
    }
  })

  return order
}

export default async function PedidoDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const order = await getOrder(params.id)

  if (!order) {
    notFound()
  }

  const total = order.totalValueCents / 100

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <Link
          href="/admin/pedidos"
          className="text-blue-600 hover:text-blue-900 mb-4 inline-block font-semibold"
        >
          ← Voltar para Pedidos
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-600">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 mb-2">Pedido {order.id.substring(0, 8)}...</h1>
            <p className="text-sm text-gray-600">
              Criado em {new Date(order.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold mb-2 text-blue-900">Cliente</h3>
            <p className="text-gray-700">{order.customer.name}</p>
            <p className="text-gray-700">{order.customer.phone}</p>
            {order.customer.email && (
              <p className="text-gray-700">{order.customer.email}</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-blue-900">Total</h3>
            <p className="text-2xl font-bold text-green-600">
              R$ {total.toFixed(2).replace('.', ',')}
            </p>
            {order.lot && (
              <p className="text-sm text-gray-600 mt-1">
                Lote: <span className="font-semibold">{order.lot.name}</span>
              </p>
            )}
            {order.exchangeToken && (
              <div className="mt-2">
                <Link
                  href={`/troca/${order.exchangeToken}`}
                  target="_blank"
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  Ver página de troca
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-4 text-blue-900">Itens</h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="border-2 border-green-600 rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">
                      {item.itemType === 'ABADA' ? 'Abadá' : 'Pulseira Extra'}
                      {item.size && ` - Tamanho ${item.size}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantidade: {item.quantity} × R$ {(item.unitPriceCents / 100).toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Retirado: {item.deliveredQuantity} / {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">
                    R$ {((item.unitPriceCents * item.quantity) / 100).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {order.deliveredAt && order.deliveredByUser && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Entregue em:</span> {new Date(order.deliveredAt).toLocaleString('pt-BR')}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Por:</span> {order.deliveredByUser.name}
            </p>
          </div>
        )}

        <PedidoActions order={order} />
      </div>
    </div>
  )
}
