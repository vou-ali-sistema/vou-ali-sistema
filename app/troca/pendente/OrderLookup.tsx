'use client'

import { useState } from 'react'
import OrderConfirmation from './OrderConfirmation'

export default function OrderLookup() {
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState('')

  async function handleLookup() {
    if (!orderId.trim()) {
      setError('Por favor, informe o código do pedido')
      return
    }

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const res = await fetch(`/api/public/orders/${orderId.trim()}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Pedido não encontrado. Verifique o código e tente novamente.')
        return
      }

      setOrder(data)
    } catch (err) {
      setError('Erro ao buscar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (order) {
    return (
      <div className="mt-6">
        <OrderConfirmation order={order} />
        <button
          onClick={() => {
            setOrder(null)
            setOrderId('')
          }}
          className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
        >
          Consultar outro pedido
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 border-2 border-blue-300">
      <h4 className="text-lg font-bold text-gray-800 mb-3">🔍 Consultar Meu Pedido</h4>
      <p className="text-sm text-gray-600 mb-4">
        Se você não recebeu os parâmetros do Mercado Pago, informe o código do seu pedido para visualizar o status.
      </p>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Código do Pedido
          </label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="Cole o código do pedido aqui"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            O código do pedido foi enviado por email ou você pode encontrá-lo no recibo do pagamento.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleLookup}
          disabled={loading || !orderId.trim()}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Buscando...' : '🔍 Buscar Pedido'}
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>💡 Dica:</strong> Se você não tem o código do pedido, verifique seu email ou entre em contato conosco pelo WhatsApp.
        </p>
      </div>
    </div>
  )
}
