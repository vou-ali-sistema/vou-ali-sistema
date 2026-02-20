'use client'

import { useState } from 'react'

export default function EnsureTrocasUserButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleEnsure() {
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/ensure-trocas-user', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Erro ao criar/atualizar usuário de trocas')
        return
      }
      setMessage(data.message || 'OK. Login: vouali.trocas | Senha: 112233')
    } catch (e: any) {
      setError(e?.message || 'Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuário de Trocas (portaria)</h2>
          <p className="text-sm text-gray-600 mt-1">
            Se o login <strong>vouali.trocas</strong> / <strong>112233</strong> não funcionar, clique abaixo para criar ou redefinir o usuário.
          </p>
        </div>
        <button
          type="button"
          onClick={handleEnsure}
          disabled={loading}
          className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50"
        >
          {loading ? 'Aguarde...' : 'Criar / atualizar usuário trocas'}
        </button>
      </div>
      {message && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <p className="mt-2 text-xs">Se aparecer erro de enum &quot;TROCAS&quot;, rode antes o SQL: prisma/add-role-trocas.sql</p>
        </div>
      )}
    </div>
  )
}
