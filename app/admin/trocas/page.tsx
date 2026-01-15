'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import QrReaderClient from '@/app/components/QrReaderClient'

interface ExchangeData {
  type: 'order' | 'courtesy'
  data: {
    id: string
    customer?: { name: string; phone: string; email?: string }
    name?: string
    phone?: string
    status: string
    items: Array<{
      id: string
      itemType: string
      size?: string
      quantity: number
      deliveredQuantity: number
    }>
  }
}

export default function TrocasPage() {
  const [searchToken, setSearchToken] = useState('')
  const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const scannerId = 'qr-reader'

  async function handleLookup(e?: React.FormEvent, tokenOverride?: string) {
    if (e) e.preventDefault()
    const tokenToSearch = (tokenOverride ?? searchToken).trim()
    if (!tokenToSearch) return

    setLoading(true)
    setError('')
    setExchangeData(null)

    try {
      const res = await fetch('/api/exchange/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToSearch }),
      })

      if (res.ok) {
        const data = await res.json()
        setExchangeData(data)
        // Fechar scanner se estiver aberto
        if (showQRScanner) {
          stopScanner()
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Token não encontrado')
      }
    } catch (error) {
      setError('Erro ao buscar token')
    } finally {
      setLoading(false)
    }
  }

  async function startScanner() {
    setShowQRScanner(true)
    setError('')
  }

  async function stopScanner() {
    setShowQRScanner(false)
  }

  function onQrResult(decodedText: string) {
    const raw = (decodedText || '').trim()
    const urlMatch = raw.match(/\/troca\/([a-zA-Z0-9]+)/)
    const extractedToken = urlMatch ? urlMatch[1] : raw
    setSearchToken(extractedToken)
    handleLookup(undefined, extractedToken)
    // fecha o leitor após encontrar
    setShowQRScanner(false)
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Trocas</h1>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-green-600">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">Buscar por Token</h2>
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <input
            type="text"
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            placeholder="Digite o token da troca"
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-green-600 to-blue-900 text-white rounded-lg hover:from-green-700 hover:to-blue-950 font-semibold shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          {!showQRScanner ? (
            <button
              type="button"
              onClick={startScanner}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Ler QR Code
            </button>
          ) : (
            <button
              type="button"
              onClick={stopScanner}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-lg transition-all"
            >
              Parar Scanner
            </button>
          )}
        </div>

        {showQRScanner && (
          <div className="mt-4">
            <div className="rounded-lg overflow-hidden" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <QrReaderClient elementId={scannerId} onResult={onQrResult} />
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              Posicione o QR code dentro da área destacada
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {exchangeData && (
          <div className="mt-6 p-4 border-2 border-green-600 rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-lg text-blue-900">
                  {exchangeData.type === 'order' 
                    ? exchangeData.data.customer?.name 
                    : exchangeData.data.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Tipo: {exchangeData.type === 'order' ? 'Pedido' : 'Cortesia'}
                </p>
                <p className="text-sm text-gray-600 font-mono">
                  Token: {searchToken.substring(0, 16)}...
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                exchangeData.data.status === 'RETIRADO' || exchangeData.data.status === 'RETIRADA'
                  ? 'bg-green-600 text-white'
                  : exchangeData.data.status === 'PAGO' || exchangeData.data.status === 'ATIVA'
                  ? 'bg-blue-600 text-white'
                  : 'bg-yellow-400 text-blue-900'
              }`}>
                {exchangeData.data.status}
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-gray-700">Itens:</h3>
              <div className="space-y-2">
                {exchangeData.data.items.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded border border-gray-200">
                    <p className="font-medium">
                      {item.itemType === 'ABADA' ? 'Abadá' : 'Pulseira Extra'}
                      {item.size && ` - Tam ${item.size}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.deliveredQuantity} / {item.quantity} retirado(s)
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Link
                href={`/admin/trocas/${exchangeData.data.id}?type=${exchangeData.type}&token=${searchToken}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Gerenciar Entrega
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
