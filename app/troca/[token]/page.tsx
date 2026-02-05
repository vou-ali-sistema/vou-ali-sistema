import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import QRCodeDisplay from './QRCodeDisplay'
import Logo from '@/app/components/Logo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getDataByToken(token: string) {
  // Decodificar URL caso o token tenha sido codificado
  let decodedToken = token
  try {
    decodedToken = decodeURIComponent(token)
  } catch (e) {
    // Se falhar, usar o token original
    decodedToken = token
  }
  
  // Limpar o token: remover espaços, quebras de linha e caracteres especiais que podem vir do email
  const cleanToken = decodedToken.trim().replace(/\s+/g, '').replace(/[^\w-]/g, '')
  
  // Debug: log para verificar o token recebido e limpo
  console.log('Token recebido (original):', token)
  console.log('Token decodificado:', decodedToken)
  console.log('Token limpo:', cleanToken)
  console.log('Comprimento do token limpo:', cleanToken.length)
  
  // Lista de variações do token para tentar buscar
  const tokenVariations = [
    cleanToken,           // Token limpo
    decodedToken,         // Token decodificado
    token,                // Token original
    cleanToken.toLowerCase(), // Token em minúsculas
    cleanToken.toUpperCase(), // Token em maiúsculas
  ].filter((t, index, self) => self.indexOf(t) === index) // Remover duplicatas
  
  // Tentar buscar Order com cada variação
  let order = null
  for (const tokenVar of tokenVariations) {
    order = await prisma.order.findUnique({
      where: { exchangeToken: tokenVar },
      include: {
        items: true,
        customer: true,
      }
    })
    if (order) {
      console.log('Pedido encontrado com variação:', tokenVar)
      break
    }
  }

  if (order) {
    return {
      type: 'order' as const,
      data: order,
    }
  }

  // Buscar Courtesy por exchangeToken (também com todas as variações)
  let courtesy = null
  for (const tokenVar of tokenVariations) {
    courtesy = await prisma.courtesy.findUnique({
      where: { exchangeToken: tokenVar },
      include: {
        items: true,
      }
    })
    if (courtesy) {
      console.log('Cortesia encontrada com variação:', tokenVar)
      break
    }
  }

  if (courtesy) {
    return {
      type: 'courtesy' as const,
      data: courtesy,
    }
  }

  // Se o token tem pelo menos 16 caracteres, tentar busca por prefixo (caso tenha sido truncado)
  if (cleanToken.length >= 16) {
    const prefix = cleanToken.substring(0, 16)
    console.log('Tentando busca por prefixo:', prefix)
    
    const ordersByPrefix = await prisma.order.findMany({
      where: {
        exchangeToken: {
          startsWith: prefix,
        }
      },
      select: {
        id: true,
        exchangeToken: true,
        status: true,
      },
      take: 5,
    })
    
    if (ordersByPrefix.length === 1) {
      // Se encontrou exatamente um pedido com esse prefixo, usar ele
      console.log('Encontrado pedido único por prefixo:', ordersByPrefix[0].exchangeToken)
      const foundOrder = await prisma.order.findUnique({
        where: { id: ordersByPrefix[0].id },
        include: {
          items: true,
          customer: true,
        }
      })
      if (foundOrder) {
        return {
          type: 'order' as const,
          data: foundOrder,
        }
      }
    } else if (ordersByPrefix.length > 1) {
      console.log('Múltiplos pedidos encontrados com prefixo:', ordersByPrefix.length)
    }
  }

  // Debug: verificar se há algum pedido com token similar (para diagnóstico)
  const similarOrders = await prisma.order.findMany({
    where: {
      exchangeToken: {
        contains: cleanToken.substring(0, Math.min(10, cleanToken.length)),
      }
    },
    select: {
      id: true,
      exchangeToken: true,
      status: true,
    },
    take: 5,
  })
  
  console.log('Pedidos com token similar encontrados:', similarOrders.length)
  if (similarOrders.length > 0) {
    console.log('Tokens similares:', similarOrders.map(o => o.exchangeToken))
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
  params: Promise<{ token: string }>
}) {
  const { token: rawToken } = await params
  
  // Decodificar o token da URL (Next.js pode codificar caracteres especiais)
  let token = rawToken
  try {
    // Tentar decodificar múltiplas vezes caso tenha sido codificado várias vezes
    let decoded = decodeURIComponent(rawToken)
    while (decoded !== token && decoded !== rawToken) {
      token = decoded
      decoded = decodeURIComponent(token)
    }
    token = decoded
  } catch (e) {
    // Se falhar, usar o token original
    token = rawToken
  }
  
  const result = await getDataByToken(token)

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

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700 mb-2">
              <strong>Token recebido:</strong>
            </p>
            <code className="block text-xs text-red-800 break-all bg-white p-2 rounded border border-red-300">
              {token}
            </code>
            <p className="text-xs text-red-600 mt-2">
              Comprimento: {token.length} caracteres (esperado: 64 caracteres)
            </p>
          </div>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-semibold mb-2">
              💡 Dicas para resolver:
            </p>
            <ul className="text-xs text-blue-700 space-y-1 text-left list-disc list-inside">
              <li>Certifique-se de copiar o token completo do email</li>
              <li>Não adicione espaços ou quebras de linha</li>
              <li>O token deve ter exatamente 64 caracteres</li>
              <li>Se o problema persistir, entre em contato com o suporte</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  const { type, data } = result
  const statusInfo = getStatusInfo(data, type)
  const url = `${process.env.NEXTAUTH_URL || process.env.APP_BASE_URL || 'http://localhost:3000'}/troca/${token}`

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

        <QRCodeDisplay url={url} token={token} />
      </div>
    </div>
  )
}
