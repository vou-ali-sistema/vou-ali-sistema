'use client'

import { useEffect, useState } from 'react'

export default function CompraToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState<boolean>(initialEnabled)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function refresh() {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar configurações')
      setEnabled(data.purchaseEnabled !== false)
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggle(next: boolean) {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseEnabled: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar configuração')
      setEnabled(data.purchaseEnabled !== false)
      setInfo(next ? 'Página de compra ativada.' : 'Página de compra bloqueada.')
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar configuração')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Compras</h2>
          <p className="text-sm text-gray-600 mt-1">
            Ative/desative a página <span className="font-semibold">/comprar</span> para liberar ou bloquear vendas.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={busy || loading}
          className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-semibold border border-gray-300 disabled:opacity-50"
        >
          Atualizar
        </button>
      </div>

      {(error || info) && (
        <div className="mt-4 space-y-2">
          {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          {info && <div className="bg-gray-50 border-2 border-gray-200 text-gray-900 px-4 py-3 rounded-lg">{info}</div>}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
        <div>
          <p className="text-sm font-semibold text-gray-900">Página de compra ativa</p>
          <p className="text-xs text-gray-600 mt-1">
            {loading ? 'Carregando status…' : enabled ? 'Ativa (clientes podem comprar).' : 'Bloqueada (clientes não conseguem comprar).'}
          </p>
        </div>

        <label className="inline-flex items-center gap-3 select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => toggle(e.target.checked)}
            disabled={busy || loading}
          />
          <span className="text-sm font-semibold text-gray-900">{enabled ? 'Ativa' : 'Bloqueada'}</span>
        </label>
      </div>
    </div>
  )
}

