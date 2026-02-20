'use client'

import { useEffect, useState } from 'react'

export default function MercadoPagoTaxa({ initialTaxa }: { initialTaxa: number }) {
  const [taxa, setTaxa] = useState<number>(initialTaxa)
  const [inputValue, setInputValue] = useState<string>(String(initialTaxa))
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
      const taxaAtual = data.mercadoPagoTaxaPercent ?? 9.0
      setTaxa(taxaAtual)
      setInputValue(String(taxaAtual))
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

  async function salvarTaxa() {
    const valor = parseFloat(inputValue.replace(',', '.'))
    if (isNaN(valor) || valor < 0 || valor > 100) {
      setError('Taxa deve ser um número entre 0 e 100')
      return
    }

    setBusy(true)
    setError('')
    setInfo('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mercadoPagoTaxaPercent: valor }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar configuração')
      setTaxa(data.mercadoPagoTaxaPercent ?? valor)
      setInputValue(String(data.mercadoPagoTaxaPercent ?? valor))
      setInfo(`Taxa do Mercado Pago atualizada para ${valor.toFixed(2)}%`)
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
          <h2 className="text-xl font-bold text-gray-900">Taxa do Mercado Pago</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure o percentual de desconto aplicado nas vendas para calcular a receita líquida.
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
          {info && <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg">{info}</div>}
        </div>
      )}

      <div className="mt-5 p-4 rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Percentual de desconto (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={busy || loading}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                placeholder="9.00"
              />
              <span className="text-sm font-semibold text-gray-700">%</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {loading ? 'Carregando...' : `Taxa atual: ${taxa.toFixed(2)}%`}
            </p>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={salvarTaxa}
              disabled={busy || loading}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-900 text-white rounded-lg hover:from-green-700 hover:to-blue-950 font-semibold shadow-lg transition-all disabled:opacity-50"
            >
              {busy ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Exemplo:</strong> Se a taxa for 9%, uma venda de R$ 100,00 terá desconto de R$ 9,00, 
            resultando em receita líquida de R$ 91,00.
          </p>
        </div>
      </div>
    </div>
  )
}
