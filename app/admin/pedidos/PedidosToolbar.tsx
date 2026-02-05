'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PedidosToolbar({
  q,
  status,
  archived,
}: {
  q: string
  status: string
  archived: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function archiveConcluidos() {
    const ok = window.confirm(
      'Arquivar pedidos concluídos (PAGO/RETIRADO/CANCELADO)?\n\nIsso limpa a lista sem apagar histórico.'
    )
    if (!ok) return

    setBusy(true)
    try {
      const res = await fetch('/api/admin/orders/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includePendentes: false }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || 'Erro ao arquivar pedidos')
        return
      }
      alert(`Arquivados: ${data.archivedCount || 0}`)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function purge(scope: 'ARCHIVED' | 'ALL') {
    const warning =
      scope === 'ALL'
        ? 'ATENÇÃO: Isso vai APAGAR TODOS OS PEDIDOS (inclusive não arquivados) e seus itens.\n\nIsso é irreversível.'
        : 'Isso vai APAGAR TODOS OS PEDIDOS ARQUIVADOS e seus itens.\n\nIsso é irreversível.'

    const ok = window.confirm(warning)
    if (!ok) return

    const phrase = scope === 'ALL' ? 'ZERAR' : 'EXCLUIR'
    const typed = window.prompt(`Digite ${phrase} para confirmar:`) || ''
    if (typed.trim().toUpperCase() !== phrase) return

    setBusy(true)
    try {
      const res = await fetch('/api/admin/orders/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || 'Erro ao limpar pedidos')
        return
      }
      alert(`OK.\nPedidos apagados: ${data.deletedOrders || 0}\nItens apagados: ${data.deletedItems || 0}`)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get('q')?.toString() || ''
    const status = formData.get('status')?.toString() || ''
    const archived = formData.get('archived')?.toString() || ''
    
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (archived === '1') params.set('archived', '1')
    
    const queryString = params.toString()
    router.push(`/admin/pedidos${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border-2 border-gray-200">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Buscar (cliente, telefone, email, pedido, MP)
          </label>
          <input
            name="q"
            defaultValue={q}
            placeholder="Ex: Maria, 1199999..., admin@..., ID do pedido..."
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos</option>
            <option value="PENDENTE">PENDENTE</option>
            <option value="PAGO">PAGO</option>
            <option value="RETIRADO">RETIRADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>
        </div>

        <div className="md:col-span-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="archived" value="1" defaultChecked={archived === '1'} />
            Mostrar arquivados
          </label>

          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-900 text-white rounded-lg hover:from-green-700 hover:to-blue-950 font-semibold shadow-lg transition-all"
          >
            Filtrar
          </button>

          <Link
            href="/admin/pedidos"
            className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-semibold border border-gray-300"
          >
            Limpar
          </Link>

          {archived !== '1' && (
            <button
              type="button"
              onClick={archiveConcluidos}
              disabled={busy}
              className="px-6 py-2 bg-yellow-100 text-yellow-900 rounded-lg hover:bg-yellow-200 font-semibold border border-yellow-300 disabled:opacity-50"
            >
              Arquivar concluídos
            </button>
          )}

          <button
            type="button"
            onClick={() => purge('ARCHIVED')}
            disabled={busy}
            className="px-6 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-semibold border border-red-200 disabled:opacity-50"
            title="Apaga pedidos arquivados (irreversível)"
          >
            Excluir arquivados
          </button>

          <button
            type="button"
            onClick={() => purge('ALL')}
            disabled={busy}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
            title="Apaga TODOS os pedidos (irreversível)"
          >
            Zerar pedidos (tudo)
          </button>
        </div>
      </form>
    </div>
  )
}

