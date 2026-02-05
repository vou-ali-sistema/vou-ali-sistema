'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    const ok = window.confirm(
      'Tem certeza que deseja excluir este pedido cancelado?\n\nEsta ação é irreversível e vai apagar o pedido e todos os seus itens.'
    )
    if (!ok) return

    setBusy(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        alert(data.error || 'Erro ao excluir pedido')
        return
      }

      alert('Pedido excluído com sucesso!')
      router.refresh()
    } catch (error) {
      console.error('Erro ao excluir pedido:', error)
      alert('Erro ao excluir pedido')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="text-red-600 hover:text-red-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      title="Excluir pedido cancelado"
    >
      {busy ? 'Excluindo...' : '🗑️ Excluir'}
    </button>
  )
}
