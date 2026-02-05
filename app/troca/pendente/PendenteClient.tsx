'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

type Props = {
  paymentId?: string
  preferenceId?: string
  externalReference?: string
}

type SyncResult =
  | { ok: false; error: string; details?: any }
  | {
      ok: true
      foundPayment?: boolean
      mpStatus?: string
      orderId?: string
      status?: string
      paymentStatus?: string
      mpPaymentId?: string | null
      exchangeToken?: string | null
      trocaUrl?: string | null
      emailSent?: boolean | null
      email?: string | null
      emailError?: string | null
    }

export default function PendenteClient({ paymentId, preferenceId, externalReference }: Props) {
  const [data, setData] = useState<SyncResult | null>(null)
  const [busy, setBusy] = useState(false)

  const canSync = useMemo(() => {
    return Boolean(paymentId || preferenceId || externalReference)
  }, [paymentId, preferenceId, externalReference])

  async function syncNow() {
    if (!canSync) return
    setBusy(true)
    try {
      const res = await fetch('/api/public/payment/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          preferenceId,
          externalReference,
        }),
      })
      const json = (await res.json().catch(() => null)) as any
      if (!res.ok) {
        setData(json || { ok: false, error: `HTTP ${res.status}` })
        return
      }
      setData(json)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!canSync) return
    let cancelled = false
    let interval: any = null

    ;(async () => {
      // Primeira sincronização imediata
      await syncNow()
      if (cancelled) return

      // Polling a cada 3 segundos para verificação mais rápida
      interval = setInterval(async () => {
        if (cancelled) return
        
        // Buscar dados atualizados antes de verificar
        const res = await fetch('/api/public/payment/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId,
            preferenceId,
            externalReference,
          }),
        })
        
        if (cancelled) return
        
        const json = (await res.json().catch(() => null)) as any
        if (res.ok && json) {
          setData(json)
          
          // Se aprovado, parar o polling
          const approved = json?.status === 'PAGO' || json?.paymentStatus === 'APPROVED'
          if (approved && interval) {
            clearInterval(interval)
            interval = null
          }
        }
      }, 3000)
    })()

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSync, paymentId, preferenceId, externalReference])

  const approved = (data as any)?.status === 'PAGO' || (data as any)?.paymentStatus === 'APPROVED'
  const rejected = (data as any)?.status === 'CANCELADO' || (data as any)?.paymentStatus === 'REJECTED'

  return (
    <div className="mt-6">
      {!canSync ? (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-left">
          <p className="text-sm text-gray-700">
            Não recebemos parâmetros do Mercado Pago nesta volta. Se você pagou e voltou pra cá, abra o admin e clique em{' '}
            <span className="font-semibold">Sincronizar Mercado Pago</span> no pedido.
          </p>
        </div>
      ) : null}

      {canSync ? (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-700">
              <div>
                <span className="font-semibold">Status:</span>{' '}
                {data && (data as any).status ? (data as any).status : 'Verificando...'}
              </div>
              {data && (data as any).mpStatus ? (
                <div className="text-xs text-gray-500">
                  Mercado Pago: <span className="font-mono">{(data as any).mpStatus}</span>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={syncNow}
              disabled={busy}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
            >
              {busy ? 'Atualizando...' : 'Atualizar agora'}
            </button>
          </div>

          {approved && (data as any).exchangeToken ? (
            <div className="mt-4 bg-gradient-to-br from-green-50 to-green-100 border-4 border-green-500 rounded-xl p-6 shadow-lg">
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">✅</div>
                <h3 className="text-2xl font-bold text-green-800 mb-1">Pagamento Aprovado!</h3>
                <p className="text-green-700">Seu ingresso está pronto para retirada</p>
              </div>
              
              {/* QR Code */}
              {(data as any).trocaUrl && (
                <div className="bg-white rounded-xl p-4 mb-4 border-2 border-green-300">
                  <p className="text-sm font-semibold text-gray-700 mb-3 text-center">QR Code para Retirada</p>
                  <div className="flex justify-center">
                    <div className="border-4 border-green-600 rounded-xl p-3 bg-white">
                      <QRCodeSVG
                        value={(data as any).trocaUrl}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Token */}
              <div className="bg-white rounded-lg p-4 mb-4 border-2 border-green-300">
                <p className="text-sm font-semibold text-gray-700 mb-2">Token de Troca:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gradient-to-r from-green-100 to-blue-100 px-4 py-3 rounded-lg border-2 border-green-600 text-blue-900 font-mono text-sm break-all">
                    {(data as any).exchangeToken}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText((data as any).exchangeToken)
                      alert('Token copiado!')
                    }}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold whitespace-nowrap"
                    title="Copiar token"
                  >
                    📋 Copiar
                  </button>
                </div>
              </div>
              
              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Link
                  href={(data as any).trocaUrl || '/'}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-center text-lg shadow-lg"
                >
                  🎫 Ver Meu Ingresso Completo
                </Link>
              </div>
              
              {/* Info do email */}
              <div className="text-xs text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                <p className="font-semibold mb-1">Informações:</p>
                <p>
                  Email:{' '}
                  {(data as any).email
                    ? `${(data as any).email} (${(data as any).emailSent ? '✅ enviado' : '⏳ enviando...'})`
                    : 'não cadastrado'}
                  {(data as any).emailError ? ` — erro: ${(data as any).emailError}` : ''}
                </p>
                <p className="mt-1 text-gray-500">
                  💡 Guarde este QR code ou token. Você precisará dele para retirar seus itens!
                </p>
              </div>
            </div>
          ) : null}

          {rejected ? (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-700">Pagamento não aprovado.</p>
              <p className="text-sm text-gray-700 mt-1">Se você tem certeza que pagou, abra o pedido no admin e sincronize.</p>
            </div>
          ) : null}

          {data && (data as any).ok === false ? (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-700">Erro</p>
              <p className="text-sm text-gray-700 mt-1">
                {(data as any).error} {(data as any).details ? `— ${(data as any).details}` : ''}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

