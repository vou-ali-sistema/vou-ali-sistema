'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EntregarItem({
  itemTrocaId,
  quantidadePendente,
}: {
  itemTrocaId: string
  quantidadePendente: number
}) {
  const router = useRouter()
  const [quantidade, setQuantidade] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEntregar() {
    if (quantidade < 1 || quantidade > quantidadePendente) {
      setError(`Quantidade deve ser entre 1 e ${quantidadePendente}`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const trocaId = window.location.pathname.split('/')[3]
      const res = await fetch(`/api/trocas/${trocaId}/entregar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemTrocaId,
          quantidade,
        }),
      })

      if (!res.ok) {
        let msg = 'Erro ao entregar item'
        try {
          const data = await res.json()
          msg = data.error || msg
        } catch {
          const text = await res.text().catch(() => '')
          if (text) msg = text
        }
        throw new Error(msg)
      }

      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Erro ao entregar item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-t pt-4 mt-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade a entregar
          </label>
          <input
            type="number"
            min="1"
            max={quantidadePendente}
            value={quantidade}
            onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Máximo: {quantidadePendente}
          </p>
        </div>
        <button
          onClick={handleEntregar}
          disabled={loading}
          className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 font-semibold shadow-lg transition-all"
        >
          {loading ? 'Entregando...' : 'Entregar'}
        </button>
      </div>
    </div>
  )
}

