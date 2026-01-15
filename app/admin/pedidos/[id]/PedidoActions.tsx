'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PedidoActions({ order }: { order: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAction(action: string) {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/pedidos/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao atualizar pedido')
      }

      router.refresh()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao executar ação'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleCriarTroca() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/trocas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao criar troca')
      }

      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Erro ao criar troca')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-t pt-6">
      <h3 className="font-semibold mb-4 text-blue-900">Ações</h3>
      
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        {order.status === 'PENDENTE' && (
          <button
            onClick={() => handleAction('confirmar')}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 font-semibold shadow-lg transition-all"
          >
            Confirmar Pagamento
          </button>
        )}

        {order.status === 'PENDENTE' && (
          <button
            onClick={() => handleAction('sync_mp')}
            disabled={loading}
            className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-semibold shadow transition-all border border-gray-300"
          >
            Sincronizar Mercado Pago
          </button>
        )}

        {order.status !== 'CANCELADO' && (
          <button
            onClick={() => handleAction('cancelar')}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold shadow-lg transition-all"
          >
            Cancelar Pedido
          </button>
        )}

        {order.status === 'PAGO' && !order.exchangeToken && (
          <button
            onClick={handleCriarTroca}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 disabled:opacity-50 font-semibold shadow-lg transition-all"
          >
            Criar Troca
          </button>
        )}
      </div>
    </div>
  )
}
