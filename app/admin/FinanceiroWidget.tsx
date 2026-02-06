'use client'

import { useEffect, useMemo, useState } from 'react'

type FinanceEntry = {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: 'PATROCINIO' | 'PAGAMENTO' | 'OUTROS'
  amountCents: number
  description: string | null
  occurredAt: string
}

function formatMoney(cents: number) {
  const v = (cents || 0) / 100
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function labelCategory(c: FinanceEntry['category']) {
  if (c === 'PATROCINIO') return 'Patrocínio'
  if (c === 'PAGAMENTO') return 'Pagamento'
  return 'Outros'
}

export default function FinanceiroWidget({
  receitaVendasCents,
  receitaVendasBrutaCents,
  descontoMercadoPagoCents,
  mercadoPagoTaxaPercent,
}: {
  receitaVendasCents: number
  receitaVendasBrutaCents: number
  descontoMercadoPagoCents: number
  mercadoPagoTaxaPercent: number
}) {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [summary, setSummary] = useState<{ incomeCents: number; expenseCents: number; netCents: number } | null>(null)

  const [type, setType] = useState<FinanceEntry['type']>('INCOME')
  const [category, setCategory] = useState<FinanceEntry['category']>('PATROCINIO')
  const [amountReais, setAmountReais] = useState('')
  const [description, setDescription] = useState('')

  const encontro = useMemo(() => {
    const income = summary?.incomeCents || 0
    const expense = summary?.expenseCents || 0
    const totalIn = receitaVendasCents + income
    const saldo = totalIn - expense
    return { income, expense, totalIn, saldo }
  }, [summary, receitaVendasCents])

  async function refresh() {
    setError('')
    setLoading(true)
    try {
      const [sRes, eRes] = await Promise.all([
        fetch('/api/admin/finance/summary', { cache: 'no-store' }),
        fetch('/api/admin/finance/entries?take=20', { cache: 'no-store' }),
      ])
      if (!sRes.ok) {
        const t = await sRes.text().catch(() => '')
        throw new Error(t || 'Erro ao carregar resumo financeiro')
      }
      if (!eRes.ok) {
        const t = await eRes.text().catch(() => '')
        throw new Error(t || 'Erro ao carregar lançamentos')
      }
      const s = await sRes.json()
      const e = await eRes.json()
      setSummary(s)
      setEntries(e || [])
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar financeiro')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function createEntry() {
    setBusy(true)
    setError('')
    try {
      const normalized = amountReais.replace(/\./g, '').replace(',', '.').trim()
      const n = Number(normalized)
      if (!n || n <= 0) throw new Error('Informe um valor válido')
      const amountCents = Math.round(n * 100)

      const res = await fetch('/api/admin/finance/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          category,
          amountCents,
          description,
        }),
      })
      if (!res.ok) {
        let msg = 'Erro ao salvar lançamento'
        try {
          const data = await res.json()
          msg = data.error || msg
        } catch {
          const text = await res.text().catch(() => '')
          if (text) msg = text
        }
        throw new Error(msg)
      }

      setAmountReais('')
      setDescription('')
      await refresh()
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar lançamento')
    } finally {
      setBusy(false)
    }
  }

  async function deleteEntry(id: string) {
    const ok = window.confirm('Excluir este lançamento?')
    if (!ok) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/finance/entries/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        let msg = 'Erro ao excluir lançamento'
        try {
          const data = await res.json()
          msg = data.error || msg
        } catch {
          const text = await res.text().catch(() => '')
          if (text) msg = text
        }
        throw new Error(msg)
      }
      await refresh()
    } catch (e: any) {
      setError(e?.message || 'Erro ao excluir lançamento')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold text-blue-900">Financeiro (Encontro de Contas)</h2>
        <button
          type="button"
          onClick={refresh}
          disabled={busy || loading}
          className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-semibold border border-gray-300 disabled:opacity-50"
        >
          Atualizar
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-xs font-semibold text-gray-700 mb-2">Resumo</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Receita bruta (vendas):</span><span className="font-bold">{formatMoney(receitaVendasBrutaCents)}</span></div>
              <div className="flex justify-between"><span>Desconto MP ({mercadoPagoTaxaPercent.toFixed(2)}%):</span><span className="font-bold text-red-600">- {formatMoney(descontoMercadoPagoCents)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-1"><span>Receita líquida (vendas):</span><span className="font-bold">{formatMoney(receitaVendasCents)}</span></div>
              <div className="flex justify-between"><span>Entradas (lançadas):</span><span className="font-bold">{formatMoney(encontro.income)}</span></div>
              <div className="flex justify-between"><span>Saídas (lançadas):</span><span className="font-bold">{formatMoney(encontro.expense)}</span></div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                <span className="font-semibold">Saldo (vendas líquidas + entradas - saídas):</span>
                <span className={`font-extrabold ${encontro.saldo < 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {formatMoney(encontro.saldo)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <p className="text-xs font-semibold text-gray-700 mb-2">Novo lançamento</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => {
                    const v = e.target.value as FinanceEntry['type']
                    setType(v)
                    setCategory(v === 'INCOME' ? 'PATROCINIO' : 'PAGAMENTO')
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="INCOME">Entrada</option>
                  <option value="EXPENSE">Saída</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="PATROCINIO">Patrocínio</option>
                  <option value="PAGAMENTO">Pagamento</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Valor (R$)</label>
                <input
                  value={amountReais}
                  onChange={(e) => setAmountReais(e.target.value)}
                  placeholder="Ex: 1500,00"
                  inputMode="decimal"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição (opcional)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Patrocínio Empresa X / Pagamento banda / Segurança..."
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={createEntry}
                  disabled={busy}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-900 text-white rounded-lg hover:from-green-700 hover:to-blue-950 font-semibold shadow-lg transition-all disabled:opacity-50"
                >
                  {busy ? 'Salvando...' : 'Adicionar lançamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Últimos lançamentos</h3>
        {loading ? (
          <p className="text-sm text-gray-600">Carregando...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum lançamento ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Categoria</th>
                  <th className="py-2 pr-3">Descrição</th>
                  <th className="py-2 pr-3">Valor</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((e) => (
                  <tr key={e.id} className="text-gray-800">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(e.occurredAt).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className={`font-semibold ${e.type === 'INCOME' ? 'text-green-700' : 'text-red-600'}`}>
                        {e.type === 'INCOME' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{labelCategory(e.category)}</td>
                    <td className="py-2 pr-3">{e.description || '-'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap font-bold">{formatMoney(e.amountCents)}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => deleteEntry(e.id)}
                        disabled={busy}
                        className="px-3 py-1 rounded bg-gray-100 border border-gray-300 hover:bg-gray-200 font-semibold disabled:opacity-50"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

