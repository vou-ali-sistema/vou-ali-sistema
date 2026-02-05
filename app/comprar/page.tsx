'use client'

import { useState, useEffect, useMemo } from 'react'
import Logo from '@/app/components/Logo'
import PromoMediaCarousel, { PromoCardMedia } from '@/app/components/PromoMediaCarousel'

interface Item {
  itemType: 'ABADA' | 'PULSEIRA_EXTRA'
  size?: string
  quantity: number
  lotId?: string // ID do lote selecionado para este item
}

interface Lot {
  id: string
  name: string
  abadaPriceCents: number
  pulseiraPriceCents: number
}

interface PromoCard {
  id: string
  title: string
  content: string
  imageUrl: string | null
  backgroundColor: string | null
  textColor: string | null
  autoPlay?: boolean
  slideInterval?: number
  linkEnabled: boolean
  linkUrl: string | null
  placement: 'HOME' | 'COMPRAR' | 'BOTH'
  comprarSlot: 'TOP' | 'BOTTOM' | null
  media?: PromoCardMedia[]
}

export default function ComprarPage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null)
  const [promoCards, setPromoCards] = useState<PromoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [purchaseEnabled, setPurchaseEnabled] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Dados do cliente
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  
  // Itens do pedido
  const [items, setItems] = useState<Item[]>([
    { itemType: 'ABADA', size: 'Tamanho Único', quantity: 1, lotId: lots[0]?.id }
  ])

  // Buscar lote ativo, preços e cards de divulgação em paralelo para melhor performance
  useEffect(() => {
    let cancelled = false
    
    async function fetchData() {
      try {
        // Executar todos os fetches em paralelo para melhorar tempo de resposta
        const [statusRes, lotRes, cardsRes] = await Promise.all([
          fetch('/api/public/purchase-status', { cache: 'no-store' }),
          fetch('/api/lot/active'),
          fetch('/api/promo-cards?placement=COMPRAR'),
        ])
        
        if (cancelled) return

        // Verificar status de compra
        if (statusRes.ok) {
          const status = await statusRes.json()
          const enabled = status?.purchaseEnabled !== false
          if (!cancelled) {
            setPurchaseEnabled(enabled)
            if (!enabled) {
              setError('As compras estão temporariamente indisponíveis. Aguarde ou entre em contato com a organização.')
              setLoading(false)
              return
            }
          }
        } else {
          if (!cancelled) setPurchaseEnabled(true)
        }

        // Processar lote ativo
        if (!lotRes.ok) {
          if (lotRes.status === 404) {
            if (!cancelled) {
              setError('Nenhum lote ativo encontrado. As vendas estão temporariamente indisponíveis.')
              setLoading(false)
            }
            return
          } else {
            throw new Error('Erro ao carregar informações')
          }
        }
        
        const lotData = await lotRes.json()
        // Pode ser objeto único ou array (múltiplos lotes ativos)
        const activeLots = Array.isArray(lotData) ? lotData : [lotData]
        if (!cancelled && activeLots.length > 0) {
          setLots(activeLots)
          // Atualizar lotId dos itens que não têm lote definido
          setItems(prev => prev.map(item => ({
            ...item,
            lotId: item.lotId || activeLots[0].id
          })))
        }

        // Processar cards de divulgação (não bloqueia se falhar; garantir array)
        if (cardsRes.ok) {
          const data = await cardsRes.json()
          if (!cancelled) setPromoCards(Array.isArray(data) ? data : [])
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Erro ao carregar informações')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { cancelled = true }
  }, [])

  function adicionarItem() {
    const defaultLotId = lots[0]?.id || null
    setItems([...items, { itemType: 'ABADA', size: 'Tamanho Único', quantity: 1, lotId: defaultLotId }])
  }

  function removerItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  function atualizarItem(index: number, campo: keyof Item, valor: any) {
    const novosItems = [...items]
    novosItems[index] = { ...novosItems[index], [campo]: valor }
    
    // Se mudar para ABADA, definir tamanho único automaticamente
    if (campo === 'itemType' && valor === 'ABADA') {
      novosItems[index].size = 'Tamanho Único'
    }
    
    // Limpar tamanho se mudar para PULSEIRA_EXTRA
    if (campo === 'itemType' && valor === 'PULSEIRA_EXTRA') {
      novosItems[index].size = undefined
    }
    
    setItems(novosItems)
  }

  // Memoizar cálculo do total para evitar re-execução a cada render
  // Cada item pode ter seu próprio lote
  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const itemLot = lots.find(l => l.id === item.lotId) || lots[0]
      if (!itemLot) return sum
      const precoUnitario = item.itemType === 'ABADA' 
        ? itemLot.abadaPriceCents 
        : itemLot.pulseiraPriceCents
      return sum + (precoUnitario * item.quantity)
    }, 0) / 100
  }, [lots, items])

  // Memoizar filtros de cards para evitar re-execução a cada render
  // IMPORTANTE: hooks devem ser chamados antes de qualquer return condicional
  const { topPreferred, bottomPreferred, unSlotted } = useMemo(() => {
    const top = promoCards.filter((c) => c.comprarSlot === 'TOP')
    const bottom = promoCards.filter((c) => c.comprarSlot === 'BOTTOM')
    const unSlotted = promoCards.filter((c) => !c.comprarSlot)
    return { topPreferred: top, bottomPreferred: bottom, unSlotted }
  }, [promoCards])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Validações
    if (!name.trim()) {
      setError('Nome é obrigatório')
      setSubmitting(false)
      return
    }

    if (!phone.trim()) {
      setError('Telefone é obrigatório')
      setSubmitting(false)
      return
    }

    if (!email.trim()) {
      setError('Email é obrigatório para receber o token de troca')
      setSubmitting(false)
      return
    }

    // Garantir que todos os abadás tenham tamanho único
    for (const item of items) {
      if (item.itemType === 'ABADA' && !item.size) {
        item.size = 'Tamanho Único'
      }
    }

    try {
      // Validar que todos os itens têm lote selecionado
      for (const item of items) {
        if (!item.lotId) {
          setError('Todos os itens devem ter um lote selecionado')
          setSubmitting(false)
          return
        }
      }

      // Agrupar itens por lote e criar um pedido por lote
      const itemsByLot = items.reduce((acc, item) => {
        const lotId = item.lotId!
        if (!acc[lotId]) {
          acc[lotId] = []
        }
        acc[lotId].push({
          itemType: item.itemType,
          size: item.itemType === 'ABADA' ? (item.size || 'Tamanho Único') : undefined,
          quantity: item.quantity,
        })
        return acc
      }, {} as Record<string, any[]>)

      // Criar pedidos para cada lote (ou agrupar em um único pedido se todos forem do mesmo lote)
      const lotIds = Object.keys(itemsByLot)
      
      if (lotIds.length === 1) {
        // Todos os itens são do mesmo lote - criar um único pedido
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: {
              name: name.trim(),
              phone: phone.trim(),
              email: email.trim(),
            },
            items: itemsByLot[lotIds[0]],
            lotId: lotIds[0],
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erro ao criar pedido')
        }

        const data = await res.json()
        
        // Redirecionar para o link de pagamento do Mercado Pago
        if (data.paymentLink) {
          window.location.href = data.paymentLink
        } else if (data.warning) {
          const errorMsg = data.warning + (data.details ? `\n\nDetalhes: ${data.details}` : '')
          setError(errorMsg)
        } else {
          setError('Erro ao gerar link de pagamento. Verifique se o Mercado Pago está configurado.')
        }
      } else {
        // Múltiplos lotes - criar um pedido por lote
        // Por enquanto, vamos criar apenas o primeiro e avisar o usuário
        // (ou podemos criar múltiplos pedidos e redirecionar para o primeiro)
        setError('Por favor, faça pedidos separados para lotes diferentes (Feminino e Masculino).')
        setSubmitting(false)
        return
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pedido')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando...</p>
        </div>
      </div>
    )
  }

  if (purchaseEnabled === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-md mx-4">
          <div className="mb-6">
            <Logo size="large" showSubtitle={false} />
          </div>
          <div className="bg-gray-50 border-2 border-gray-200 text-gray-900 px-4 py-3 rounded-lg">
            {error || 'As compras estão temporariamente indisponíveis.'}
          </div>
        </div>
      </div>
    )
  }

  if (lots.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-md mx-4">
          <div className="mb-6">
            <Logo size="large" showSubtitle={false} />
          </div>
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  const topCard = topPreferred[0] || unSlotted[0] || null
  const bottomCandidate =
    bottomPreferred[0] ||
    (unSlotted.find((c) => c.id !== (topCard ? topCard.id : '')) || null)
  const bottomCard = bottomCandidate && topCard && bottomCandidate.id === topCard.id ? null : bottomCandidate

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Card de Divulgação - Acima do formulário */}
        {topCard && (
          <div className="mb-8">
            <div
              className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden"
              style={{
                backgroundColor: topCard.backgroundColor || '#f8f9fa',
                color: topCard.textColor || '#333333',
              }}
            >
              {Array.isArray(topCard.media) && topCard.media.length > 0 ? (
                <div className="p-4 pb-0">
                  <PromoMediaCarousel
                    media={topCard.media}
                    autoPlay={topCard.autoPlay ?? true}
                    intervalMs={topCard.slideInterval ?? 5000}
                    altBase={topCard.title}
                  />
                </div>
              ) : topCard.imageUrl ? (
                <img
                  src={topCard.imageUrl}
                  alt={topCard.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{topCard.title}</h3>
                <p className="whitespace-pre-line">{topCard.content}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Dados do Cliente */}
          <div>
            <h3 className="text-xl font-bold text-blue-900 mb-4">Seus Dados</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="seu@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Você receberá o token de troca por email após o pagamento
                </p>
              </div>
            </div>
          </div>

          {/* Itens */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-blue-900">Itens do Pedido</h3>
              <button
                type="button"
                onClick={adicionarItem}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                + Adicionar Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                const itemLot = lots.find(l => l.id === item.lotId) || lots[0] || null
                return (
                <div key={index} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {lots.length > 1 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lote *
                        </label>
                        <select
                          value={item.lotId || ''}
                          onChange={(e) => atualizarItem(index, 'lotId', e.target.value)}
                          required
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          {lots.map((lot) => (
                            <option key={lot.id} value={lot.id}>
                              {lot.name.includes('FEMININO') ? 'Feminino' : lot.name.includes('MASCULINO') ? 'Masculino' : lot.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo *
                      </label>
                      <select
                        value={item.itemType}
                        onChange={(e) => atualizarItem(index, 'itemType', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="ABADA">Abadá</option>
                        <option value="PULSEIRA_EXTRA">Pulseira Extra</option>
                      </select>
                    </div>
                    {item.itemType === 'ABADA' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tamanho *
                        </label>
                        <input
                          type="text"
                          value={item.size || 'Tamanho Único'}
                          onChange={(e) => atualizarItem(index, 'size', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Tamanho Único"
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

                  <div className="mt-2 text-sm text-gray-600">
                    {itemLot && (
                      <>
                        Preço unitário: R$ {((item.itemType === 'ABADA' ? itemLot.abadaPriceCents : itemLot.pulseiraPriceCents) / 100).toFixed(2).replace('.', ',')}
                        {' | '}
                        Subtotal: R$ {((item.itemType === 'ABADA' ? itemLot.abadaPriceCents : itemLot.pulseiraPriceCents) * item.quantity / 100).toFixed(2).replace('.', ',')}
                      </>
                    )}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerItem(index)}
                      className="mt-2 text-sm text-red-600 hover:text-red-900 font-semibold"
                    >
                      Remover Item
                    </button>
                  )}
                </div>
                )
              })}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-green-600 to-blue-900 rounded-lg p-6 text-white">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Total:</span>
              <span className="text-3xl font-bold">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-green-600 to-blue-900 text-white py-4 px-6 rounded-lg hover:from-green-700 hover:to-blue-950 font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {submitting ? 'Processando...' : 'Finalizar Compra'}
          </button>
        </form>

        {/* Card de Divulgação - Embaixo do formulário */}
        {bottomCard && (
          <div className="mt-8">
            <div
              className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden"
              style={{
                backgroundColor: bottomCard.backgroundColor || '#f8f9fa',
                color: bottomCard.textColor || '#333333',
              }}
            >
              {Array.isArray(bottomCard.media) && bottomCard.media.length > 0 ? (
                <div className="p-4 pb-0">
                  <PromoMediaCarousel
                    media={bottomCard.media}
                    autoPlay={bottomCard.autoPlay ?? true}
                    intervalMs={bottomCard.slideInterval ?? 5000}
                    altBase={bottomCard.title}
                  />
                </div>
              ) : bottomCard.imageUrl ? (
                <img
                  src={bottomCard.imageUrl}
                  alt={bottomCard.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{bottomCard.title}</h3>
                <p className="whitespace-pre-line">{bottomCard.content}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
