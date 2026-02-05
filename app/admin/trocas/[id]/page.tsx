'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function TrocaDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get('type')
  const token = searchParams.get('token')
  
  const [exchangeData, setExchangeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [delivering, setDelivering] = useState(false)
  const [deliveries, setDeliveries] = useState<Record<string, number>>({})

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  async function fetchData() {
    try {
      const res = await fetch('/api/exchange/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (res.ok) {
        const data = await res.json()
        setExchangeData(data)
        // Inicializar deliveries
        const initialDeliveries: Record<string, number> = {}
        data.data.items.forEach((item: any) => {
          const pendente = item.quantity - item.deliveredQuantity
          initialDeliveries[item.id] = pendente > 0 ? 1 : 0
        })
        setDeliveries(initialDeliveries)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRedeem() {
    if (!token) return

    setDelivering(true)

    const deliveriesArray = Object.entries(deliveries)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        if (type === 'order') {
          return { orderItemId: id, deliverQty: qty }
        } else {
          return { courtesyItemId: id, deliverQty: qty }
        }
      })

    try {
      const res = await fetch('/api/exchange/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          deliveries: deliveriesArray,
        }),
      })

      if (res.ok) {
        router.refresh()
        fetchData()
        alert('Itens entregues com sucesso!')
      } else {
        const error = await res.json()
        alert(error.error || 'Erro ao entregar itens')
      }
    } catch (error) {
      alert('Erro ao entregar itens')
    } finally {
      setDelivering(false)
    }
  }

  if (loading) {
    return <div className="px-4 py-6">Carregando...</div>
  }

  if (!exchangeData) {
    return (
      <div className="px-4 py-6">
        <p>Dados não encontrados</p>
        <Link href="/admin/trocas" className="text-blue-600 hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  const { data } = exchangeData

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <Link
          href="/admin/trocas"
          className="text-blue-600 hover:text-blue-900 mb-4 inline-block font-semibold"
        >
          ← Voltar para Trocas
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-600">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 mb-2">
              {type === 'order' ? 'Pedido' : 'Cortesia'}
            </h1>
            <p className="text-gray-600">
              {type === 'order' ? data.customer?.name : data.name}
            </p>
            <p className="text-sm text-gray-500 font-mono mt-1">
              Token: {token?.substring(0, 16)}...
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            data.status === 'RETIRADO' || data.status === 'RETIRADA'
              ? 'bg-green-600 text-white'
              : 'bg-yellow-400 text-blue-900'
          }`}>
            {data.status}
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Itens</h2>
          <div className="space-y-4">
            {data.items.map((item: any) => {
              const pendente = item.quantity - item.deliveredQuantity
              const maxDeliver = Math.min(pendente, deliveries[item.id] || 0)

              return (
                <div key={item.id} className="border-2 border-green-600 rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-blue-900">
                        {item.itemType === 'ABADA' ? 'Abadá' : 'Pulseira Extra'}
                        {item.size && ` - Tam ${item.size}`}
                      </h3>
                      <p className="text-sm text-gray-700 mt-1">
                        Total: {item.quantity} | Retirado: {item.deliveredQuantity} | Pendente: {pendente}
                      </p>
                    </div>
                    {pendente > 0 ? (
                      <span className="px-3 py-1 bg-yellow-400 text-blue-900 rounded-full text-sm font-semibold">
                        Pendente
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold">
                        ✓ Retirado
                      </span>
                    )}
                  </div>
                  {pendente > 0 && (
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade a entregar (máx: {pendente})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={pendente}
                        value={deliveries[item.id] || 0}
                        onChange={(e) => setDeliveries({
                          ...deliveries,
                          [item.id]: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleRedeem}
            disabled={delivering || Object.values(deliveries).every(qty => qty === 0)}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 font-semibold shadow-lg transition-all"
          >
            {delivering ? 'Entregando...' : 'Confirmar Entrega'}
          </button>
        </div>
      </div>
    </div>
  )
}
