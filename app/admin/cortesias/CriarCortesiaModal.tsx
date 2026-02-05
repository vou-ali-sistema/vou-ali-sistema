'use client'

import { useState } from 'react'

interface Item {
  itemType: 'ABADA' | 'PULSEIRA_EXTRA'
  size?: string
  quantity: number
}

export default function CriarCortesiaModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [itens, setItens] = useState<Item[]>([
    { itemType: 'ABADA', quantity: 1 }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function adicionarItem() {
    setItens([...itens, { itemType: 'ABADA', quantity: 1 }])
  }

  function removerItem(index: number) {
    setItens(itens.filter((_, i) => i !== index))
  }

  function atualizarItem(index: number, campo: keyof Item, valor: any) {
    const novosItens = [...itens]
    novosItens[index] = { ...novosItens[index], [campo]: valor }
    
    // Limpar tamanho se mudar para PULSEIRA_EXTRA
    if (campo === 'itemType' && valor === 'PULSEIRA_EXTRA') {
      novosItens[index].size = undefined
    }
    
    setItens(novosItens)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validações
    for (const item of itens) {
      if (item.itemType === 'ABADA' && !item.size) {
        setError('Tamanho é obrigatório para ABADA')
        setLoading(false)
        return
      }
    }

    try {
      const res = await fetch('/api/cortesias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: phone || undefined,
          items: itens,
        }),
      })

      if (!res.ok) {
        let msg = 'Erro ao criar cortesia'
        try {
          const data = await res.json()
          msg = data.error || msg
        } catch {
          const text = await res.text().catch(() => '')
          if (text) msg = text
        }
        throw new Error(msg)
      }

      onClose()
    } catch (error: any) {
      setError(error.message || 'Erro ao criar cortesia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900">Nova Cortesia</h2>
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
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Itens *
                </label>
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="text-sm text-blue-600 hover:text-blue-900 font-semibold"
                >
                  + Adicionar Item
                </button>
              </div>

              <div className="space-y-4">
                {itens.map((item, index) => (
                  <div key={index} className="border-2 border-green-600 rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo *
                        </label>
                        <select
                          value={item.itemType}
                          onChange={(e) => atualizarItem(index, 'itemType', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="ABADA">ABADA</option>
                          <option value="PULSEIRA_EXTRA">PULSEIRA EXTRA</option>
                        </select>
                      </div>

                      {item.itemType === 'ABADA' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tamanho *
                          </label>
                          <input
                            type="text"
                            value={item.size || ''}
                            onChange={(e) => atualizarItem(index, 'size', e.target.value)}
                            required
                            placeholder="Ex: P, M, G"
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantidade *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => atualizarItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          required
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    {itens.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerItem(index)}
                        className="text-sm text-red-600 hover:text-red-900 font-semibold"
                      >
                        Remover Item
                      </button>
                    )}
                  </div>
                ))}
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
                {loading ? 'Criando...' : 'Criar Cortesia'}
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
