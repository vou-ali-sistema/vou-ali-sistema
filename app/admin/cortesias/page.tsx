'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CriarCortesiaModal from './CriarCortesiaModal'

interface Courtesy {
  id: string
  name: string
  phone?: string
  status: string
  exchangeToken: string
  items: Array<{
    id: string
    itemType: string
    size?: string
    quantity: number
    deliveredQuantity: number
  }>
  createdAt: string
}

export default function CortesiasPage() {
  const [cortesias, setCortesias] = useState<Courtesy[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [purging, setPurging] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCortesias()
  }, [])

  async function fetchCortesias() {
    try {
      const res = await fetch('/api/cortesias')
      if (res.ok) {
        const data = await res.json()
        setCortesias(data)
      }
    } catch (error) {
      console.error('Erro ao buscar cortesias:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handlePurge() {
    const ok = confirm(
      'ATENÇÃO: isso vai excluir TODAS as cortesias (e itens) permanentemente.\n\nDeseja continuar?'
    )
    if (!ok) return

    setPurging(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/courtesies/purge', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erro ao limpar cortesias')
      setMessage(
        `Cortesias limpas: ${data.courtesiesDeleted ?? 0} (itens: ${data.itemsDeleted ?? 0}).`
      )
      await fetchCortesias()
    } catch (err: any) {
      setMessage(err.message || 'Erro ao limpar cortesias')
    } finally {
      setPurging(false)
    }
  }

  if (loading) {
    return <div className="px-4 py-6">Carregando...</div>
  }

  const statusClass = (status: string) =>
    status === 'RETIRADA'
      ? 'bg-green-100 text-green-800'
      : status === 'ATIVA'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-red-100 text-red-800'

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold text-blue-900">Cortesias</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={handlePurge}
            disabled={purging}
            className="min-h-[44px] px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-lg transition-all disabled:opacity-50 touch-manipulation"
          >
            {purging ? 'Limpando...' : 'Limpar Cortesias'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="min-h-[44px] px-6 py-2 bg-gradient-to-r from-green-600 to-blue-900 text-white rounded-lg hover:from-green-700 hover:to-blue-950 font-semibold shadow-lg transition-all touch-manipulation"
          >
            Nova Cortesia
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 bg-gray-50 border-2 border-gray-200 text-gray-900 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      {showModal && (
        <CriarCortesiaModal
          onClose={() => {
            setShowModal(false)
            fetchCortesias()
          }}
        />
      )}

      {/* Mobile: cards com Ações em destaque (Ver Página = QR code) */}
      <div className="md:hidden space-y-4">
        {cortesias.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-purple-200 p-6 text-center text-gray-500">
            Nenhuma cortesia. Clique em Nova Cortesia.
          </div>
        ) : (
          cortesias.map((cortesia) => (
            <div
              key={cortesia.id}
              className="bg-white rounded-xl border-2 border-purple-200 shadow-sm overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{cortesia.name}</p>
                <p className="text-sm text-gray-600">{cortesia.phone || '–'}</p>
                <p className="text-sm text-gray-600">{cortesia.items.length} item(ns)</p>
                <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${statusClass(cortesia.status)}`}>
                  {cortesia.status}
                </span>
              </div>
              <div className="p-4 bg-purple-50/50 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-600">Ações</p>
                <Link
                  href={`/troca/${cortesia.exchangeToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[48px] flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold text-center touch-manipulation"
                >
                  Ver Página (QR Code)
                </Link>
                <Link
                  href={`/admin/trocas?token=${cortesia.exchangeToken}`}
                  className="min-h-[48px] flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-semibold text-center touch-manipulation"
                >
                  Gerenciar
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-600">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-purple-600 to-blue-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Itens
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Token
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cortesias.map((cortesia) => (
              <tr key={cortesia.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                  {cortesia.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {cortesia.phone || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {cortesia.items.length} item(ns)
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass(cortesia.status)}`}>
                    {cortesia.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                  {cortesia.exchangeToken.substring(0, 12)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/troca/${cortesia.exchangeToken}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Ver Página
                  </Link>
                  <Link
                    href={`/admin/trocas?token=${cortesia.exchangeToken}`}
                    className="text-green-600 hover:text-green-900"
                  >
                    Gerenciar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
