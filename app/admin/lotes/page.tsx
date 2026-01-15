'use client'

import { useState, useEffect } from 'react'

interface Lot {
  id: string
  name: string
  abadaPriceCents: number
  pulseiraPriceCents: number
  active: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
}

export default function LotesPage() {
  const [lotes, setLotes] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLot, setEditingLot] = useState<Lot | null>(null)

  useEffect(() => {
    fetchLotes()
  }, [])

  async function fetchLotes() {
    try {
      const res = await fetch('/api/admin/lots', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setLotes(data)
      }
    } catch (error) {
      console.error('Erro ao buscar lotes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleActivate(id: string) {
    try {
      const res = await fetch(`/api/admin/lots/${id}/activate`, {
        method: 'POST',
      })

      if (res.ok) {
        await fetchLotes()
        alert('Lote ativado com sucesso!')
      } else {
        alert('Erro ao ativar lote')
      }
    } catch (error) {
      alert('Erro ao ativar lote')
    }
  }

  async function handleDelete(lot: Lot) {
    if (lot.active) {
      alert('Não é possível excluir um lote ativo. Ative outro lote primeiro.')
      return
    }

    const ok = window.confirm(`Tem certeza que deseja excluir o lote "${lot.name}"?`)
    if (!ok) return

    try {
      const res = await fetch(`/api/admin/lots/${lot.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        alert(data.error || 'Erro ao excluir lote')
        return
      }

      await fetchLotes()
      alert('Lote excluído com sucesso!')
    } catch (error) {
      alert('Erro ao excluir lote')
    }
  }

  if (loading) {
    return <div className="px-4 py-6">Carregando...</div>
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Lotes</h1>
        <button
          onClick={() => {
            setEditingLot(null)
            setShowModal(true)
          }}
          className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-900 text-white rounded-lg hover:from-green-700 hover:to-blue-950 font-semibold shadow-lg transition-all"
        >
          Novo Lote
        </button>
      </div>

      {showModal && (
        <LotModal
          lot={editingLot}
          onClose={() => {
            setShowModal(false)
            setEditingLot(null)
            fetchLotes()
          }}
        />
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-green-600">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-green-600 to-blue-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Preço Abadá
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Preço Pulseira
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lotes.map((lote) => (
              <tr key={lote.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {lote.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  R$ {(lote.abadaPriceCents / 100).toFixed(2).replace('.', ',')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  R$ {(lote.pulseiraPriceCents / 100).toFixed(2).replace('.', ',')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    lote.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {lote.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {!lote.active && (
                    <button
                      onClick={() => handleActivate(lote.id)}
                      className="text-green-600 hover:text-green-900 font-semibold"
                    >
                      Ativar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingLot(lote)
                      setShowModal(true)
                    }}
                    className="text-blue-600 hover:text-blue-900 font-semibold"
                  >
                    Editar
                  </button>
                  {!lote.active && (
                    <button
                      onClick={() => handleDelete(lote)}
                      className="text-red-600 hover:text-red-900 font-semibold"
                    >
                      Excluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LotModal({ lot, onClose }: { lot: Lot | null; onClose: () => void }) {
  const [name, setName] = useState(lot?.name || '')
  const [abadaPriceCents, setAbadaPriceCents] = useState(lot?.abadaPriceCents ? (lot.abadaPriceCents / 100).toString() : '')
  const [pulseiraPriceCents, setPulseiraPriceCents] = useState(lot?.pulseiraPriceCents ? (lot.pulseiraPriceCents / 100).toString() : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validar valores antes de enviar
      const abadaPrice = parseFloat(abadaPriceCents)
      const pulseiraPrice = parseFloat(pulseiraPriceCents)

      if (isNaN(abadaPrice) || abadaPrice <= 0) {
        throw new Error('Preço do Abadá deve ser maior que zero')
      }

      if (isNaN(pulseiraPrice) || pulseiraPrice <= 0) {
        throw new Error('Preço da Pulseira deve ser maior que zero')
      }

      const url = lot ? `/api/admin/lots/${lot.id}` : '/api/admin/lots'
      const method = lot ? 'PUT' : 'POST'

      const body: any = {
        name: name.trim(),
        abadaPriceCents: Math.round(abadaPrice * 100),
        pulseiraPriceCents: Math.round(pulseiraPrice * 100),
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        const errorMsg = data.error || 'Erro ao salvar lote'
        const details = data.details ? `\n\nDetalhes: ${JSON.stringify(data.details)}` : ''
        throw new Error(errorMsg + details)
      }

      onClose()
    } catch (error: any) {
      setError(error.message || 'Erro ao salvar lote')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900">
              {lot ? 'Editar Lote' : 'Novo Lote'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Abadá (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={abadaPriceCents}
                onChange={(e) => setAbadaPriceCents(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Pulseira Extra (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pulseiraPriceCents}
                onChange={(e) => setPulseiraPriceCents(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-2 bg-gradient-to-r from-green-600 to-blue-900 text-white rounded-lg hover:from-green-700 hover:to-blue-950 disabled:opacity-50 font-semibold shadow-lg transition-all"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

