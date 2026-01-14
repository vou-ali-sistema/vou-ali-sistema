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

  if (loading) {
    return <div className="px-4 py-6">Carregando...</div>
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Cortesias</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-900 text-white rounded-lg hover:from-green-700 hover:to-blue-950 font-semibold shadow-lg transition-all"
        >
          Nova Cortesia
        </button>
      </div>

      {showModal && (
        <CriarCortesiaModal
          onClose={() => {
            setShowModal(false)
            fetchCortesias()
          }}
        />
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-600">
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
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    cortesia.status === 'RETIRADA'
                      ? 'bg-green-100 text-green-800'
                      : cortesia.status === 'ATIVA'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
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
