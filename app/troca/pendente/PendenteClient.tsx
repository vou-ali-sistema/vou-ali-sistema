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
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null)
  const [tryingRecentOrder, setTryingRecentOrder] = useState(false)

  // Tentar recuperar orderId recente do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vouali_recent_order_id')
      if (stored) {
        setRecentOrderId(stored)
      }
    }
  }, [])

  const canSync = useMemo(() => {
    return Boolean(paymentId || preferenceId || externalReference || recentOrderId)
  }, [paymentId, preferenceId, externalReference, recentOrderId])

  async function syncNow(useRecentOrder = false) {
    if (!canSync) return
    setBusy(true)
    try {
      // Se não há parâmetros mas temos um orderId recente, tentar usar ele
      const externalRef = externalReference || (useRecentOrder && recentOrderId ? recentOrderId : undefined)
      
      const res = await fetch('/api/public/payment/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          preferenceId,
          externalReference: externalRef,
        }),
      })
      const json = (await res.json().catch(() => null)) as any
      if (!res.ok) {
        setData(json || { ok: false, error: `HTTP ${res.status}` })
        return
      }
      setData(json)
      
      // Se encontrou um pedido aprovado, limpar o localStorage
      if (json?.status === 'PAGO' && typeof window !== 'undefined') {
        localStorage.removeItem('vouali_recent_order_id')
      }
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    let interval: any = null
    let attempts = 0
    const maxAttempts = 120 // Máximo de 4 minutos (120 * 2s)

    ;(async () => {
      // Primeira sincronização imediata
      if (canSync) {
        await syncNow()
      } else if (recentOrderId && !tryingRecentOrder) {
        // Se não há parâmetros mas temos orderId recente, tentar sincronizar
        setTryingRecentOrder(true)
        await syncNow(true)
        setTryingRecentOrder(false)
      }
      
      if (cancelled) return

      // Polling mais agressivo: a cada 2 segundos (ao invés de 3)
      // Continuar mesmo sem parâmetros se tivermos orderId recente
      const shouldPoll = canSync || recentOrderId
      
      if (!shouldPoll) return

      interval = setInterval(async () => {
        if (cancelled) return
        attempts++
        
        // Se já tentou muitas vezes sem sucesso, parar
        if (attempts > maxAttempts) {
          if (interval) {
            clearInterval(interval)
            interval = null
          }
          return
        }
        
        // Buscar dados atualizados
        const externalRef = externalReference || recentOrderId || undefined
        const res = await fetch('/api/public/payment/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId,
            preferenceId,
            externalReference: externalRef,
          }),
        })
        
        if (cancelled) return
        
        const json = (await res.json().catch(() => null)) as any
        if (res.ok && json) {
          setData(json)
          
          // Se aprovado, parar o polling e limpar localStorage
          const approved = json?.status === 'PAGO' || json?.paymentStatus === 'APPROVED'
          if (approved && interval) {
            clearInterval(interval)
            interval = null
            if (typeof window !== 'undefined') {
              localStorage.removeItem('vouali_recent_order_id')
            }
          }
        }
      }, 2000) // Polling a cada 2 segundos (mais rápido)
    })()

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSync, paymentId, preferenceId, externalReference, recentOrderId])

  const approved = (data as any)?.status === 'PAGO' || (data as any)?.paymentStatus === 'APPROVED'
  const rejected = (data as any)?.status === 'CANCELADO' || (data as any)?.paymentStatus === 'REJECTED'

  return (
    <div className="mt-6">
      {!canSync && !tryingRecentOrder && !recentOrderId ? (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-left">
          <p className="text-sm text-gray-700 mb-2">
            <strong>⚠️ Não recebemos parâmetros do Mercado Pago.</strong>
          </p>
          <p className="text-sm text-gray-700 mb-3">
            Estamos verificando automaticamente se seu pagamento foi aprovado. Isso pode levar alguns segundos após o pagamento.
          </p>
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 mt-3">
            <p className="text-sm text-blue-800 font-semibold mb-1">📧 Verifique seu email:</p>
            <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
              <li>Procure por um email de "Bloco Vou Ali"</li>
              <li>O assunto será sobre "Token de Troca"</li>
              <li>O email contém seu token completo e link direto</li>
            </ul>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            <strong>💡 Dica:</strong> Se você acabou de pagar, aguarde alguns segundos. A confirmação aparece automaticamente aqui!
          </p>
        </div>
      ) : null}
      
      {(tryingRecentOrder || (recentOrderId && !data && !canSync)) ? (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-700 mb-2">
            🔍 Verificando status do pagamento...
          </p>
          <p className="text-xs text-blue-600">
            Aguarde alguns segundos. Estamos sincronizando com o Mercado Pago automaticamente.
          </p>
        </div>
      ) : null}
      
      {canSync && !data && !busy ? (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-700">
            ⏳ Aguardando confirmação do pagamento...
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Verificando a cada 2 segundos. Isso pode levar alguns instantes após o pagamento.
          </p>
        </div>
      ) : null}

      {canSync ? (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="text-sm text-gray-700">
              <div>
                <span className="font-semibold">Status:</span>{' '}
                {data && (data as any).status ? (
                  <span className={`font-bold ${
                    (data as any).status === 'PAGO' ? 'text-green-600' : 
                    (data as any).status === 'CANCELADO' ? 'text-red-600' : 
                    'text-yellow-600'
                  }`}>
                    {(data as any).status}
                  </span>
                ) : (
                  <span className="text-yellow-600">Verificando...</span>
                )}
              </div>
              {data && (data as any).mpStatus ? (
                <div className="text-xs text-gray-500 mt-1">
                  Mercado Pago: <span className="font-mono">{(data as any).mpStatus}</span>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => syncNow()}
              disabled={busy}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? '⏳ Atualizando...' : '🔄 Atualizar agora'}
            </button>
          </div>
          
          {!data || ((data as any).status !== 'PAGO' && (data as any).status !== 'CANCELADO') ? (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mt-3">
              <p className="text-xs text-blue-800">
                <strong>⏱️ Tempo de processamento:</strong> Pagamentos Pix geralmente são confirmados em <strong>10-30 segundos</strong> após o pagamento. 
                Estamos verificando automaticamente a cada 2 segundos.
              </p>
            </div>
          ) : null}

          {/* Se já temos confirmação do pedido via OrderConfirmation, não mostrar duplicado */}
          {approved && (data as any).exchangeToken ? (
            <div className="mt-4 bg-gradient-to-br from-green-50 to-green-100 border-4 border-green-500 rounded-xl p-6 shadow-lg">
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">✅</div>
                <h3 className="text-2xl font-bold text-green-800 mb-1">Pagamento Confirmado!</h3>
                <p className="text-green-700 font-semibold">Seu ingresso está pronto para retirada</p>
              </div>
              
              {/* Mensagem sobre email */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 font-semibold mb-1">📧 Confirmação por Email:</p>
                <p className="text-xs text-blue-700">
                  Um email com seu token completo foi enviado para{' '}
                  <strong>{(data as any).email || 'o endereço cadastrado'}</strong>.
                  {' '}{(data as any).emailSent ? '✅ Enviado com sucesso!' : (data as any).emailSent === false ? '⏳ Enviando...' : ''}
                </p>
              </div>
              
              {/* QR Code */}
              {(data as any).trocaUrl && (
                <div className="bg-white rounded-xl p-4 mb-4 border-2 border-green-300">
                  <p className="text-sm font-semibold text-gray-700 mb-3 text-center">QR Code para Retirada</p>
                  <div className="flex justify-center">
                    <div className="border-4 border-green-600 rounded-xl p-3 bg-white">
                      <QRCodeSVG
                        value={typeof window !== 'undefined' ? `${window.location.origin}${(data as any).trocaUrl}` : (data as any).trocaUrl}
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
                <p className="text-sm font-semibold text-gray-700 mb-2">🔑 Seu Token de Troca:</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <code className="flex-1 bg-gradient-to-r from-green-100 to-blue-100 px-4 py-3 rounded-lg border-2 border-green-600 text-blue-900 font-mono text-sm break-all">
                    {(data as any).exchangeToken}
                  </code>
                  <div className="flex gap-2">
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
                    {(data as any).trocaUrl && (
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}${(data as any).trocaUrl}`
                          if (navigator.share) {
                            navigator.share({
                              title: 'Token de Troca - Bloco Vou Ali',
                              text: `Meu token de troca: ${(data as any).exchangeToken}`,
                              url: url,
                            }).catch(() => {
                              navigator.clipboard.writeText(url)
                              alert('Link copiado!')
                            })
                          } else {
                            navigator.clipboard.writeText(url)
                            alert('Link copiado!')
                          }
                        }}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold whitespace-nowrap"
                        title="Compartilhar token"
                      >
                        📤 Compartilhar
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  💡 Guarde este token! Você precisará dele para retirar seus itens.
                </p>
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
              
              {/* Instruções finais */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
                <p className="text-xs text-yellow-800 font-semibold mb-1">📋 Próximos Passos:</p>
                <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                  <li>Guarde este QR code ou token em local seguro</li>
                  <li>Verifique seu email para receber uma cópia do token</li>
                  <li>Apresente o QR code ou token no momento da retirada</li>
                </ul>
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

