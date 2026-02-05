'use client'

import { useState, useEffect } from 'react'

interface Lot {
  id: string
  name: string
  abadaPriceCents: number
  pulseiraPriceCents: number | null // Pode ser null
  pulseiraName: string | null // Nome/descrição da pulseira
  abadaProducedQty: number
  pulseiraProducedQty: number
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
    if (!id) {
      alert('Erro: ID do lote não fornecido')
      return
    }

    try {
      const res = await fetch(`/api/admin/lots/${id}/activate`, {
        method: 'POST',
      })

      if (res.ok) {
        await fetchLotes()
        alert('Lote ativado com sucesso!')
      } else {
        let errorMsg = `Erro ${res.status} ao ativar lote`
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
          if (data.details) {
            errorMsg += `\n\nDetalhes: ${data.details}`
          }
        } catch {
          const text = await res.text().catch(() => '')
          if (text) errorMsg += `\n\nResposta: ${text}`
        }
        alert(errorMsg)
        console.error('Erro ao ativar lote:', { status: res.status, id })
      }
    } catch (error) {
      console.error('Erro ao ativar lote:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Erro ao ativar lote: ${errorMessage}`)
    }
  }

  async function handleDeactivate(id: string) {
    if (!id) {
      alert('Erro: ID do lote não fornecido')
      return
    }

    if (!window.confirm('Tem certeza que deseja desativar este lote?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/lots/${id}/deactivate`, {
        method: 'POST',
      })

      if (res.ok) {
        await fetchLotes()
        alert('Lote desativado com sucesso!')
      } else {
        let errorMsg = `Erro ${res.status} ao desativar lote`
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
          if (data.details) {
            errorMsg += `\n\nDetalhes: ${data.details}`
          }
        } catch {
          const text = await res.text().catch(() => '')
          if (text) errorMsg += `\n\nResposta: ${text}`
        }
        alert(errorMsg)
        console.error('Erro ao desativar lote:', { status: res.status, id })
      }
    } catch (error) {
      console.error('Erro ao desativar lote:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Erro ao desativar lote: ${errorMessage}`)
    }
  }

  async function handleDelete(lot: Lot) {
    const ok = window.confirm(
      lot.active
        ? `O lote "${lot.name}" está ATIVO. Deseja excluir mesmo assim?\n\nIsso vai desativar e excluir o lote (se não houver pedidos vinculados).`
        : `Tem certeza que deseja excluir o lote "${lot.name}"?`
    )
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Lotes</h1>
        <button
          onClick={() => {
            setEditingLot(null)
            setShowModal(true)
          }}
          className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-green-600 to-blue-900 text-white rounded-lg hover:from-green-700 hover:to-blue-950 font-semibold shadow-lg transition-all"
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
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full divide-y divide-gray-200">
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
                Produzidos (A/P)
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
                  {lote.pulseiraPriceCents !== null 
                    ? (
                      <div>
                        <div className="font-medium">{lote.pulseiraName || 'Pulseira Extra'}</div>
                        <div className="text-xs text-gray-500">R$ {(lote.pulseiraPriceCents / 100).toFixed(2).replace('.', ',')}</div>
                      </div>
                    )
                    : <span className="text-gray-400">-</span>
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {lote.abadaProducedQty ?? 0} / {lote.pulseiraProducedQty ?? 0}
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
                  {lote.active ? (
                    <button
                      onClick={() => handleDeactivate(lote.id)}
                      className="text-orange-600 hover:text-orange-900 font-semibold"
                    >
                      Desativar
                    </button>
                  ) : (
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
                  <button
                    onClick={() => handleDelete(lote)}
                    className="text-red-600 hover:text-red-900 font-semibold"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LotModal({ lot, onClose }: { lot: Lot | null; onClose: () => void }) {
  const [name, setName] = useState(lot?.name || '')
  const [abadaPriceCents, setAbadaPriceCents] = useState(lot?.abadaPriceCents ? (lot.abadaPriceCents / 100).toString() : '')
  const [pulseiraPriceCents, setPulseiraPriceCents] = useState(lot?.pulseiraPriceCents ? (lot.pulseiraPriceCents / 100).toString() : '')
  const [pulseiraName, setPulseiraName] = useState(lot?.pulseiraName || '')
  const [abadaProducedQty, setAbadaProducedQty] = useState(lot?.abadaProducedQty?.toString() || '0')
  const [pulseiraProducedQty, setPulseiraProducedQty] = useState(lot?.pulseiraProducedQty?.toString() || '0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validar valores antes de enviar
      const abadaPrice = parseFloat(abadaPriceCents)
      const pulseiraPrice = pulseiraPriceCents ? parseFloat(pulseiraPriceCents) : null

      if (isNaN(abadaPrice) || abadaPrice <= 0) {
        throw new Error('Preço do Abadá deve ser maior que zero')
      }

      // Pulseira é opcional - apenas validar se foi preenchida
      if (pulseiraPriceCents && pulseiraPriceCents.trim() !== '' && (isNaN(pulseiraPrice!) || pulseiraPrice! <= 0)) {
        throw new Error('Preço da Pulseira deve ser maior que zero (ou deixe em branco se não houver pulseira)')
      }

      const url = lot ? `/api/admin/lots/${lot.id}` : '/api/admin/lots'
      const method = lot ? 'PUT' : 'POST'

      const body: any = {
        name: name.trim(),
        abadaPriceCents: Math.round(abadaPrice * 100),
        pulseiraPriceCents: pulseiraPrice && pulseiraPriceCents.trim() !== '' ? Math.round(pulseiraPrice * 100) : null,
        pulseiraName: pulseiraName.trim() || null, // Nome da pulseira (opcional)
        abadaProducedQty: Math.max(0, parseInt(abadaProducedQty || '0', 10) || 0),
        pulseiraProducedQty: Math.max(0, parseInt(pulseiraProducedQty || '0', 10) || 0),
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
                Preço Pulseira Extra (R$) <span className="text-gray-500 text-xs font-normal">(Opcional - apenas primeiro lote)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pulseiraPriceCents}
                onChange={(e) => setPulseiraPriceCents(e.target.value)}
                placeholder="Deixe em branco se não houver pulseira"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                A pulseira só será vendida/dada no primeiro lote como bonificação de compra antecipada.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Pulseira <span className="text-gray-500 text-xs font-normal">(Opcional - ex: "Pulseira do After")</span>
              </label>
              <input
                type="text"
                value={pulseiraName}
                onChange={(e) => setPulseiraName(e.target.value)}
                placeholder="Ex: Pulseira do After, Pulseira Conversa, etc."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nome ou descrição da pulseira para que os clientes saibam para que serve (bonificação do after).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qtde de Abadás Produzidos
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={abadaProducedQty}
                  onChange={(e) => setAbadaProducedQty(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qtde de Pulseiras Produzidas
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pulseiraProducedQty}
                  onChange={(e) => setPulseiraProducedQty(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
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

