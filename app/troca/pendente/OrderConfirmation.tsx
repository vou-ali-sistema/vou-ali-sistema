'use client'

import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'

interface OrderConfirmationProps {
  order: {
    id: string
    status: string
    paymentStatus: string
    totalValueCents: number
    exchangeToken: string | null
    createdAt: string
    paidAt: string | null
    items: Array<{
      id: string
      itemType: string
      size: string | null
      quantity: number
      unitPriceCents: number
      totalCents: number
    }>
    customer: {
      name: string
    }
    lot: {
      id: string
      name: string
    } | null
  }
}

export default function OrderConfirmation({ order }: OrderConfirmationProps) {
  const isPaid = order.status === 'PAGO'
  const isPending = order.status === 'PENDENTE'
  const isCancelled = order.status === 'CANCELADO'
  const trocaUrl = order.exchangeToken ? `/troca/${order.exchangeToken}` : null

  const formatCurrency = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getItemName = (itemType: string) => {
    return itemType === 'ABADA' ? 'Abadá' : 'Pulseira Extra'
  }

  return (
    <div className="space-y-4">
      {/* Status do Pedido */}
      <div className={`rounded-xl p-4 border-2 ${
        isPaid 
          ? 'bg-green-50 border-green-500' 
          : isPending 
          ? 'bg-yellow-50 border-yellow-500' 
          : isCancelled
          ? 'bg-red-50 border-red-500'
          : 'bg-blue-50 border-blue-500'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-bold ${
              isPaid ? 'text-green-800' : isPending ? 'text-yellow-800' : isCancelled ? 'text-red-800' : 'text-blue-800'
            }`}>
              {isPaid ? '✅ Pagamento Aprovado!' : isPending ? '⏳ Pagamento Pendente' : isCancelled ? '❌ Pedido Cancelado' : '📦 Pedido Retirado'}
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              Status: <strong>{order.status}</strong>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Pedido #</p>
            <p className="text-sm font-mono font-bold text-gray-800">{order.id.substring(0, 8)}</p>
          </div>
        </div>
      </div>

      {/* Informações do Cliente */}
      <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-2">Cliente</h4>
        <p className="text-sm text-gray-700">{order.customer.name}</p>
        <p className="text-xs text-gray-500 mt-1">Data do pedido: {formatDate(order.createdAt)}</p>
        {order.paidAt && (
          <p className="text-xs text-gray-500">Data do pagamento: {formatDate(order.paidAt)}</p>
        )}
      </div>

      {/* Itens do Pedido */}
      <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Itens do Pedido</h4>
        {order.lot && (
          <p className="text-xs text-gray-600 mb-2">Lote: <strong>{order.lot.name}</strong></p>
        )}
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {getItemName(item.itemType)}
                  {item.size && <span className="text-gray-600"> - {item.size}</span>}
                </p>
                <p className="text-xs text-gray-600">
                  Quantidade: {item.quantity} × {formatCurrency(item.unitPriceCents)} = {formatCurrency(item.totalCents)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t-2 border-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Total:</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(order.totalValueCents)}</span>
          </div>
        </div>
      </div>

      {/* Token de Troca (se pago) */}
      {isPaid && order.exchangeToken && trocaUrl && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-4 border-green-500">
          <div className="text-center mb-4">
            <h4 className="text-xl font-bold text-green-800 mb-2">🎫 Seu Ingresso Está Pronto!</h4>
            <p className="text-sm text-green-700">Use o QR code ou token abaixo para retirar seus itens</p>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-xl p-4 mb-4 border-2 border-green-300">
            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">QR Code para Retirada</p>
            <div className="flex justify-center">
              <div className="border-4 border-green-600 rounded-xl p-3 bg-white">
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? `${window.location.origin}${trocaUrl}` : trocaUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
          </div>

          {/* Token */}
          <div className="bg-white rounded-lg p-4 mb-4 border-2 border-green-300">
            <p className="text-sm font-semibold text-gray-700 mb-2">🔑 Token de Troca:</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <code className="flex-1 bg-gradient-to-r from-green-100 to-blue-100 px-4 py-3 rounded-lg border-2 border-green-600 text-blue-900 font-mono text-sm break-all">
                {order.exchangeToken}
              </code>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.exchangeToken!)
                    alert('Token copiado!')
                  }}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold whitespace-nowrap"
                >
                  📋 Copiar
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}${trocaUrl}`
                    if (navigator.share) {
                      navigator.share({
                        title: 'Token de Troca - Bloco Vou Ali',
                        text: `Meu token de troca: ${order.exchangeToken}`,
                        url: url,
                      }).catch(() => {
                        navigator.clipboard.writeText(url)
                        alert('Link copiado!')
                      })
                    } else {
                      navigator.clipboard.writeText(url)
                      alert('Link copiado!')
                    }
                  }}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold whitespace-nowrap"
                >
                  📤 Compartilhar
                </button>
              </div>
            </div>
          </div>

          {/* Botão Ver Ingresso */}
          <Link
            href={trocaUrl}
            className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-center text-lg shadow-lg"
          >
            🎫 Ver Meu Ingresso Completo
          </Link>

          {/* Aviso sobre Email */}
          <div className="mt-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>📧 Email:</strong> Você também receberá um email com este token completo. Verifique sua caixa de entrada!
            </p>
          </div>
        </div>
      )}

      {/* Mensagem se ainda está pendente */}
      {isPending && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-semibold mb-2">⏳ Aguardando Confirmação do Pagamento</p>
          <p className="text-xs text-yellow-700">
            Seu pagamento está sendo processado. Assim que for aprovado, seu token de troca aparecerá aqui automaticamente.
            Você também receberá um email com o token quando o pagamento for confirmado.
          </p>
        </div>
      )}

      {/* Mensagem se foi cancelado */}
      {isCancelled && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
          <p className="text-sm text-red-800 font-semibold mb-2">❌ Pagamento Não Aprovado</p>
          <p className="text-xs text-red-700">
            Seu pagamento foi recusado ou cancelado. Se você tem certeza que pagou, entre em contato conosco.
          </p>
        </div>
      )}
    </div>
  )
}
