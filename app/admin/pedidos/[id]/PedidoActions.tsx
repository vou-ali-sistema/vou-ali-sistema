'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

export default function PedidoActions({ order }: { order: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleAction(action: string) {
    setLoading(true)
    setError('')
    setInfo('')

    try {
      const res = await fetch(`/api/pedidos/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao atualizar pedido')
      }

      if (action === 'resend_token_email') {
        setInfo('Token enviado por email (verifique a caixa de entrada e o spam).')
        // Pequeno delay para o usuário ver a mensagem antes do refresh
        setTimeout(() => {
          router.refresh()
        }, 1200)
        return
      }

      router.refresh()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao executar ação'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function getTrocaUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    if (!order?.exchangeToken) return ''
    return `${origin}/troca/${order.exchangeToken}`
  }

  async function buildQrPngFile() {
    const trocaUrl = getTrocaUrl()
    if (!trocaUrl) throw new Error('Token não encontrado para gerar QR.')

    const dataUrl = await QRCode.toDataURL(trocaUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    const blob = await fetch(dataUrl).then((r) => r.blob())
    return new File([blob], `qrcode-${order.exchangeToken}.png`, { type: 'image/png' })
  }

  async function downloadQr() {
    setError('')
    setInfo('')
    try {
      const file = await buildQrPngFile()
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setInfo('QR baixado. Agora é só enviar no WhatsApp junto com o token.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar QR'
      setError(msg)
    }
  }

  async function shareQrToWhatsApp() {
    setError('')
    setInfo('')
    try {
      const file = await buildQrPngFile()
      const tokenText = `${order.exchangeToken}`

      // Preferir compartilhar a IMAGEM + token (mobile)
      const navAny: any = navigator as any
      if (navAny?.share) {
        const payload: any = { text: tokenText }
        if (navAny.canShare?.({ files: [file] })) {
          payload.files = [file]
        }
        await navAny.share(payload)
        setInfo('Compartilhado.')
        return
      }

      // Fallback: abrir WhatsApp Web com apenas o token (sem link)
      window.open(`https://wa.me/?text=${encodeURIComponent(tokenText)}`, '_blank', 'noopener,noreferrer')
      setInfo('Seu navegador não suporta compartilhar imagem automaticamente. Use "Baixar QR" para enviar a imagem.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao compartilhar'
      setError(msg)
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setInfo('Copiado!')
    } catch {
      setError('Não foi possível copiar automaticamente. Copie manualmente.')
    }
  }

  return (
    <div className="border-t pt-6">
      <h3 className="font-semibold mb-4 text-blue-900">Ações</h3>
      
      {info && (
        <div className="bg-gray-50 border-2 border-gray-200 text-gray-800 px-4 py-3 rounded-lg mb-4">
          {info}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {order?.exchangeToken && (
        <div className="mb-4 border-2 border-gray-200 rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-semibold">Token:</span>{' '}
            <span className="font-mono break-all">{order.exchangeToken}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy(order.exchangeToken)}
              className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-semibold border border-gray-300"
            >
              Copiar Token
            </button>
            <button
              type="button"
              onClick={shareQrToWhatsApp}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold"
            >
              Compartilhar QR (WhatsApp)
            </button>
            <button
              type="button"
              onClick={downloadQr}
              className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-semibold border border-gray-300"
            >
              Baixar QR (PNG)
            </button>
            <a
              className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-semibold border border-gray-300"
              href={getTrocaUrl()}
              target="_blank"
              rel="noreferrer"
            >
              Abrir QR
            </a>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {order.status === 'PENDENTE' && (
          <button
            onClick={() => handleAction('confirmar')}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 font-semibold shadow-lg transition-all"
          >
            Confirmar Pagamento
          </button>
        )}

        {order.status === 'PENDENTE' && (
          <button
            onClick={() => handleAction('sync_mp')}
            disabled={loading}
            className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-semibold shadow transition-all border border-gray-300"
          >
            Sincronizar Mercado Pago
          </button>
        )}

        {order.status === 'PAGO' && !order.exchangeToken && (
          <button
            onClick={() => handleAction('generate_exchange_token')}
            disabled={loading}
            className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-semibold shadow transition-all border border-gray-300"
          >
            Gerar Token/QR
          </button>
        )}

        {order.status === 'PAGO' && order.exchangeToken && (
          <button
            onClick={() => handleAction('resend_token_email')}
            disabled={loading}
            className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-semibold shadow transition-all border border-gray-300"
          >
            Reenviar Token por Email
          </button>
        )}

        {order.status !== 'CANCELADO' && (
          <button
            onClick={() => handleAction('cancelar')}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold shadow-lg transition-all"
          >
            Cancelar Pedido
          </button>
        )}
      </div>
    </div>
  )
}
