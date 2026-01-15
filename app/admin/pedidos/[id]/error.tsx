'use client'

import { useEffect } from 'react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erro na página do pedido:', error)
  }, [error])

  return (
    <div className="px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white border-2 border-red-200 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">Erro ao abrir o pedido</h2>
        <p className="text-gray-700 mb-4">
          Ocorreu um erro ao carregar os dados do pedido. Tente novamente.
        </p>
        {error?.digest ? (
          <p className="text-sm text-gray-500 mb-4">
            Digest: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Tentar novamente
          </button>
          <a
            href="/admin/pedidos"
            className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-800 hover:bg-gray-50"
          >
            Voltar para Pedidos
          </a>
        </div>
      </div>
    </div>
  )
}

