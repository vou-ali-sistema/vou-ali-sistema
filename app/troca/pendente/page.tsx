import Logo from '@/app/components/Logo'
import PendenteClient from './PendenteClient'
import OrderConfirmation from './OrderConfirmation'
import OrderLookup from './OrderLookup'
import { prisma } from '@/lib/prisma'

async function getOrderById(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: {
            id: true,
            itemType: true,
            size: true,
            quantity: true,
            unitPriceCents: true,
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
        lot: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!order) {
      return null
    }

    const customer = order.customer
    return {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalValueCents: order.totalValueCents,
      exchangeToken: order.exchangeToken,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || null,
      items: order.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        size: item.size,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.quantity * item.unitPriceCents,
      })),
      customer: customer ? { name: customer.name } : { name: '' },
      lot: order.lot ? { id: order.lot.id, name: order.lot.name } : null,
    }
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return null
  }
}

type ParamsRecord = Record<string, string | string[] | undefined>

export default async function TrocaPendentePage({
  searchParams,
}: {
  searchParams?: Promise<ParamsRecord>
}) {
  const params: ParamsRecord = await (searchParams ?? Promise.resolve({} as ParamsRecord))
  
  const getParam = (key: string) => {
    const v = params[key]
    if (!v) return undefined
    return Array.isArray(v) ? v[0] : v
  }

  // Priorizar orderId se disponível
  const orderId = getParam('orderId')
  const paymentId = getParam('payment_id') || getParam('collection_id')
  const preferenceId = getParam('preference_id')
  const externalReference = getParam('external_reference') || orderId // Usar orderId como fallback

  // Tentar buscar o pedido se tivermos orderId
  let order = null
  if (orderId) {
    order = await getOrderById(orderId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400 flex items-center justify-center py-8 px-4">
      <div className={`w-full ${order ? 'max-w-4xl' : 'max-w-md'} bg-white rounded-2xl shadow-2xl p-8 border-4 border-yellow-400`}>
        <div className="mb-6 text-center">
          <div className="inline-block">
            <Logo size="medium" showSubtitle={false} />
          </div>
        </div>

        {order ? (
          // Mostrar confirmação do pedido
          <div>
            <OrderConfirmation order={order} />
            {/* Ainda manter o PendenteClient para sincronização em tempo real */}
            <div className="mt-6">
              <PendenteClient 
                paymentId={paymentId} 
                preferenceId={preferenceId} 
                externalReference={externalReference || orderId} 
              />
            </div>
          </div>
        ) : (
          // Mostrar tela de processamento se não encontrou o pedido
          <div>
            <div className="mb-6 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Processando Pagamento
              </h3>
              <p className="text-gray-600">
                Aguarde a confirmação do pagamento. Assim que for aprovado, seu QR code e token aparecerão aqui automaticamente!
              </p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>💡 Importante:</strong> Assim que o pagamento for confirmado, você verá seu QR code e token de troca nesta página automaticamente.
              </p>
              <p className="text-sm text-gray-700">
                <strong>📧 Email:</strong> Você também receberá um email com o token completo assim que o pagamento for aprovado. Verifique sua caixa de entrada!
              </p>
            </div>

            <PendenteClient paymentId={paymentId} preferenceId={preferenceId} externalReference={externalReference} />
            
            {/* Mostrar opção de consultar pedido se não há parâmetros */}
            {!orderId && !paymentId && !preferenceId && !externalReference && (
              <div className="mt-6">
                <OrderLookup />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

