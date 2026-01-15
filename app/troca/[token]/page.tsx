import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import QRCodeDisplay from './QRCodeDisplay'
import Logo from '@/app/components/Logo'

async function getDataByToken(token: string) {
  // Buscar Order por exchangeToken
  const order = await prisma.order.findUnique({
    where: { exchangeToken: token },
    include: {
      items: true,
      customer: true,
    }
  })

  if (order) {
    return {
      type: 'order' as const,
      data: order,
    }
  }

  // Buscar Courtesy por exchangeToken
  const courtesy = await prisma.courtesy.findUnique({
    where: { exchangeToken: token },
    include: {
      items: true,
    }
  })

  if (courtesy) {
    return {
      type: 'courtesy' as const,
      data: courtesy,
    }
  }

  return null
}

function getStatusInfo(data: any, type: 'order' | 'courtesy') {
  if (type === 'order') {
    const order = data
    if (order.status === 'RETIRADO') {
      return { text: '✓ Retirado', color: 'bg-green-600 text-white' }
    }
    if (order.status === 'PAGO') {
      // Verificar se está parcialmente retirado
      const todosEntregues = order.items.every((item: any) => item.deliveredQuantity >= item.quantity)
      const algumEntregue = order.items.some((item: any) => item.deliveredQuantity > 0)
      
      if (todosEntregues) {
        return { text: '✓ Retirado', color: 'bg-green-600 text-white' }
      }
      if (algumEntregue) {
        return { text: '⏳ Retirada Parcial', color: 'bg-yellow-400 text-blue-900' }
      }
      return { text: '✓ Pago - Aguardando Retirada', color: 'bg-blue-600 text-white' }
    }
    return { text: '⏳ Pendente', color: 'bg-yellow-400 text-blue-900' }
  } else {
    const courtesy = data
    if (courtesy.status === 'RETIRADA') {
      return { text: '✓ Retirado', color: 'bg-green-600 text-white' }
    }
    if (courtesy.status === 'ATIVA') {
      // Verificar se está parcialmente retirado
      const todosEntregues = courtesy.items.every((item: any) => item.deliveredQuantity >= item.quantity)
      const algumEntregue = courtesy.items.some((item: any) => item.deliveredQuantity > 0)
      
      if (todosEntregues) {
        return { text: '✓ Retirado', color: 'bg-green-600 text-white' }
      }
      if (algumEntregue) {
        return { text: '⏳ Retirada Parcial', color: 'bg-yellow-400 text-blue-900' }
      }
      return { text: '✓ Cortesia - Aguardando Retirada', color: 'bg-purple-600 text-white' }
    }
    return { text: '⏳ Pendente', color: 'bg-yellow-400 text-blue-900' }
  }
}

export default async function TrocaPage({
  params,
}: {
  params: { token: string }
}) {
  const result = await getDataByToken(params.token)

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400 flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center border-4 border-yellow-400">
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-1">
              <span className="text-green-600">BLOCO</span>
            </h1>
            <h2 className="text-3xl font-bold text-blue-900 mb-4">VOU ALI</h2>
          </div>
          
          <div className="mb-6">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Token Inválido
            </h3>
            <p className="text-gray-600">
              O token informado não foi encontrado. Verifique se o token está correto ou entre em contato conosco.
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              <strong>Token:</strong> {params.token.substring(0, 16)}...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { type, data } = result
  const statusInfo = getStatusInfo(data, type)
  const url = `${process.env.NEXTAUTH_URL || process.env.APP_BASE_URL || 'http://localhost:3000'}/troca/${params.token}`

  // Determinar nome e informações do cliente
  const nome = type === 'order' ? data.customer.name : data.name
  const telefone = type === 'order' ? data.customer.phone : data.phone
  const email = type === 'order' ? data.customer.email : null
  const items = type === 'order' ? data.items : data.items

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6 border-4 border-yellow-400">
          <div className="text-center mb-6">
            <div className="inline-block mb-4">
              <Logo size="medium" showSubtitle={false} />
            </div>
            <p className="text-lg font-semibold text-gray-700">Troca de Itens</p>
          </div>
          <div className="mb-4 space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Nome:</span> {nome}
            </p>
            {email && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Email:</span> {email}
              </p>
            )}
            {telefone && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Telefone:</span> {telefone}
              </p>
            )}
            {type === 'courtesy' && (
              <p className="text-xs text-purple-600 font-semibold mt-2">
                🎁 Cortesia
              </p>
            )}
          </div>
          <div className="mb-4">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6 border-4 border-yellow-400">
          <h2 className="text-2xl font-bold mb-4 text-center text-blue-900">Itens</h2>
          <div className="space-y-4">
            {items.map((item: any) => {
              const entregue = item.deliveredQuantity >= item.quantity
              const pendente = item.quantity - item.deliveredQuantity
              
              return (
                <div
                  key={item.id}
                  className="border-2 border-green-600 rounded-xl p-4 bg-gradient-to-r from-green-50 to-blue-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-blue-900">
                        {item.itemType === 'ABADA' ? 'Abadá' : 'Pulseira Extra'}
                        {item.size && ` - Tamanho ${item.size}`}
                      </h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Quantidade Total:</span> {item.quantity}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Retirado:</span> {item.deliveredQuantity} / {item.quantity}
                        </p>
                        {pendente > 0 && (
                          <p className="text-sm text-yellow-700 font-semibold">
                            Pendente: {pendente}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {entregue ? (
                        <span className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-bold shadow-lg">
                          ✓ Retirado
                        </span>
                      ) : item.deliveredQuantity > 0 ? (
                        <span className="px-4 py-2 bg-yellow-400 text-blue-900 rounded-full text-sm font-bold shadow-lg">
                          ⏳ Parcial
                        </span>
                      ) : (
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg">
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <QRCodeDisplay url={url} token={params.token} />
      </div>
    </div>
  )
}
