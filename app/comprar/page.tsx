'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
  pulseiraPriceCents: number | null // Opcional - apenas primeiro lote tem pulseira
  pulseiraName: string | null // Nome/descrição da pulseira (ex: "Pulseira do After")
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
  // Estados separados para lotes masculino e feminino
  const [selectedLotIdMasculino, setSelectedLotIdMasculino] = useState<string | null>(null)
  const [selectedLotIdFeminino, setSelectedLotIdFeminino] = useState<string | null>(null)
  // Lotes genéricos selecionados (sem distinção de gênero)
  const [selectedLotesGenericos, setSelectedLotesGenericos] = useState<string[]>([])
  // Rastrear qual foi o primeiro lote selecionado (para adicionar pulseira apenas nele)
  const [primeiroLoteSelecionado, setPrimeiroLoteSelecionado] = useState<string | null>(null)
  const [promoCards, setPromoCards] = useState<PromoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [purchaseEnabled, setPurchaseEnabled] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  /** Link de pagamento quando estamos na tela "Redirecionando para o Mercado Pago" (permite abrir em nova aba) */
  const [redirectingToPayment, setRedirectingToPayment] = useState<string | null>(null)

  // Dados do cliente
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  
  // Itens do pedido - serão preenchidos automaticamente quando lotes forem selecionados
  const [items, setItems] = useState<Item[]>([])

  // Função auxiliar para verificar se um lote é masculino ou feminino
  const getLotType = (lotName: string): 'MASCULINO' | 'FEMININO' | null => {
    const nameUpper = lotName.toUpperCase()
    if (nameUpper.includes('MASCULINO')) return 'MASCULINO'
    if (nameUpper.includes('FEMININO')) return 'FEMININO'
    return null
  }

  // Buscar lote ativo, preços e cards de divulgação em paralelo para melhor performance
  useEffect(() => {
    let cancelled = false
    
    async function fetchData() {
      try {
        // Executar todos os fetches em paralelo para melhorar tempo de resposta
        const [statusRes, lotRes, cardsRes] = await Promise.all([
          fetch('/api/public/purchase-status', { cache: 'no-store' }),
          fetch('/api/lot/active', { cache: 'no-store' }), // Sem cache para sempre buscar lotes atualizados
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
        const activeLots = Array.isArray(lotData) ? lotData : [lotData]

        if (!cancelled && activeLots.length > 0) {
          setLots(activeLots)
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

  // Adicionar abadá extra (além do lote padrão)
  // Permite adicionar múltiplos abadás do mesmo lote
  function adicionarItemExtra() {
    // Usar o primeiro lote selecionado como padrão
    const defaultLotId = selectedLotIdMasculino || selectedLotIdFeminino
    if (!defaultLotId) {
      setError('Selecione pelo menos um lote primeiro')
      return
    }
    
    // Adicionar um novo abadá do lote selecionado
    setItems([...items, { 
      itemType: 'ABADA', 
      size: 'Tamanho Único', 
      quantity: 1, 
      lotId: defaultLotId 
    }])
  }
  
  // Adicionar abadá de um lote específico
  const adicionarAbadaDoLote = useCallback((lotId: string) => {
    const lot = lots.find(l => l.id === lotId)
    if (!lot) return
    
    setItems(prevItems => [...prevItems, { 
      itemType: 'ABADA', 
      size: 'Tamanho Único', 
      quantity: 1, 
      lotId: lotId 
    }])
  }, [lots])

  // Adicionar pulseira extra de um lote específico
  const adicionarPulseiraDoLote = useCallback((lotId: string) => {
    const lot = lots.find(l => l.id === lotId)
    if (!lot) return
    
    setItems(prevItems => [...prevItems, { 
      itemType: 'PULSEIRA_EXTRA', 
      quantity: 1,
      lotId: lotId
    }])
  }, [lots])

  // Adicionar pulseira extra (não precisa de lote selecionado)
  function adicionarPulseiraExtra() {
    // Usar o primeiro lote disponível que tenha pulseira como referência para preço
    // Priorizar: primeiro lote selecionado > lote masculino > lote feminino > primeiro lote genérico > qualquer lote com pulseira
    const lotReferencia = 
      (primeiroLoteSelecionado && lots.find(l => l.id === primeiroLoteSelecionado && l.pulseiraPriceCents)) ||
      (selectedLotIdMasculino && lots.find(l => l.id === selectedLotIdMasculino && l.pulseiraPriceCents)) ||
      (selectedLotIdFeminino && lots.find(l => l.id === selectedLotIdFeminino && l.pulseiraPriceCents)) ||
      (selectedLotesGenericos[0] && lots.find(l => l.id === selectedLotesGenericos[0] && l.pulseiraPriceCents)) ||
      lots.find(l => l.pulseiraPriceCents)
    
    if (!lotReferencia || !lotReferencia.pulseiraPriceCents) {
      setError('Nenhum lote com pulseira disponível. A pulseira só está disponível no primeiro lote como bonificação.')
      return
    }
    
    // Pulseira extra não precisa de lotId obrigatório, mas podemos usar o primeiro lote como referência
    setItems([...items, { 
      itemType: 'PULSEIRA_EXTRA', 
      quantity: 1,
      lotId: lotReferencia.id // Usar como referência, mas não é obrigatório
    }])
  }

  // Handler para mudança de lote masculino
  // NÃO adiciona itens automaticamente - apenas marca o lote como selecionado
  const handleLoteMasculinoChange = useCallback((lotId: string) => {
    const lotAnterior = selectedLotIdMasculino
    
    // Atualizar estado do lote selecionado
    setSelectedLotIdMasculino(lotId || null)
    
    // Se desmarcou o lote, remover TODOS os itens deste lote (deferir para não bloquear)
    if (!lotId && lotAnterior) {
      setTimeout(() => {
        setItems(prevItems => {
          const itemsRestantes = prevItems.filter(item => item.lotId !== lotAnterior)
          
          // Se era o primeiro lote, atualizar para o próximo lote disponível
          if (primeiroLoteSelecionado === lotAnterior) {
            const proximoLote = selectedLotIdFeminino || selectedLotesGenericos[0] || null
            setPrimeiroLoteSelecionado(proximoLote)
          }
          
          return itemsRestantes
        })
      }, 0)
    } else if (lotId && !primeiroLoteSelecionado) {
      // Se este é o primeiro lote selecionado, marcar como primeiro
      setPrimeiroLoteSelecionado(lotId)
    }
  }, [selectedLotIdMasculino, selectedLotIdFeminino, selectedLotesGenericos, primeiroLoteSelecionado])

  // Handler para mudança de lote feminino
  // NÃO adiciona itens automaticamente - apenas marca o lote como selecionado
  const handleLoteFemininoChange = useCallback((lotId: string) => {
    const lotAnterior = selectedLotIdFeminino
    
    // Atualizar estado do lote selecionado
    setSelectedLotIdFeminino(lotId || null)
    
    // Se desmarcou o lote, remover TODOS os itens deste lote (deferir para não bloquear)
    if (!lotId && lotAnterior) {
      setTimeout(() => {
        setItems(prevItems => {
          const itemsRestantes = prevItems.filter(item => item.lotId !== lotAnterior)
          
          // Se era o primeiro lote, atualizar para o próximo lote disponível
          if (primeiroLoteSelecionado === lotAnterior) {
            const proximoLote = selectedLotIdMasculino || selectedLotesGenericos[0] || null
            setPrimeiroLoteSelecionado(proximoLote)
          }
          
          return itemsRestantes
        })
      }, 0)
    } else if (lotId && !primeiroLoteSelecionado) {
      // Se este é o primeiro lote selecionado, marcar como primeiro
      setPrimeiroLoteSelecionado(lotId)
    }
  }, [selectedLotIdFeminino, selectedLotIdMasculino, selectedLotesGenericos, primeiroLoteSelecionado])

  // Handler para mudança de lote genérico (sem distinção de gênero)
  const handleLoteGenericoChange = useCallback((lotId: string, isSelected: boolean) => {
    if (isSelected) {
      // Adicionar lote aos selecionados
      setSelectedLotesGenericos(prev => [...prev, lotId])
      
      // Se é o primeiro lote selecionado, marcar como primeiro
      if (!primeiroLoteSelecionado) {
        setPrimeiroLoteSelecionado(lotId)
      }
    } else {
      // Remover lote dos selecionados
      setSelectedLotesGenericos(prev => prev.filter(id => id !== lotId))
      
      // Remover todos os itens deste lote (deferir para não bloquear)
      setTimeout(() => {
        setItems(prevItems => {
          const itemsRestantes = prevItems.filter(item => item.lotId !== lotId)
          
          // Se era o primeiro lote, atualizar para o próximo disponível
          if (primeiroLoteSelecionado === lotId) {
            const proximoLote = selectedLotIdMasculino || selectedLotIdFeminino || selectedLotesGenericos.find(id => id !== lotId) || null
            setPrimeiroLoteSelecionado(proximoLote)
          }
          
          return itemsRestantes
        })
      }, 0)
    }
  }, [selectedLotesGenericos, selectedLotIdMasculino, selectedLotIdFeminino, primeiroLoteSelecionado])

  const removerItem = useCallback((index: number) => {
    // Permitir remover qualquer item, mesmo que seja o único
    // O usuário pode sempre adicionar novamente se necessário
    // Usar função de atualização para evitar dependência de items
    setItems(prevItems => prevItems.filter((_, i) => i !== index))
  }, [])

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
  // Cada item pode ter seu próprio lote - sempre usar o lote correto do item
  const total = useMemo(() => {
    if (lots.length === 0) return 0
    return items.reduce((sum, item) => {
      // Sempre buscar o lote correto do item - nunca usar fallback
      const itemLot = item.lotId ? lots.find(l => l.id === item.lotId) : null
      if (!itemLot) return sum // Se não encontrar o lote, não adicionar ao total
      const precoUnitario = item.itemType === 'ABADA' 
        ? itemLot.abadaPriceCents 
        : (itemLot.pulseiraPriceCents || 0) // Se não tiver pulseira, usar 0
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Validações rápidas (deferir para não bloquear)
    await new Promise(resolve => setTimeout(resolve, 0))

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

    // Garantir que todos os abadás tenham tamanho único (usar cópia para não mutar diretamente)
    const itemsComTamanho = items.map(item => {
      if (item.itemType === 'ABADA' && !item.size) {
        return { ...item, size: 'Tamanho Único' }
      }
      return item
    })

    try {
      // Validar que pelo menos um lote foi selecionado
      if (!selectedLotIdMasculino && !selectedLotIdFeminino && selectedLotesGenericos.length === 0) {
        setError('Selecione pelo menos um lote para continuar')
        setSubmitting(false)
        return
      }

      // Validar que há pelo menos um item
      if (itemsComTamanho.length === 0) {
        setError('Nenhum item encontrado. Selecione um lote para adicionar itens ao pedido.')
        setSubmitting(false)
        return
      }

      // Validar que todos os itens têm lote selecionado
      const itemsSemLote = itemsComTamanho.filter(item => !item.lotId)
      if (itemsSemLote.length > 0) {
        setError('Alguns itens não têm lote associado. Recarregue a página e tente novamente.')
        setSubmitting(false)
        return
      }

      // Validar que todos os itens têm tipo válido
      const itemsSemTipo = itemsComTamanho.filter(item => !item.itemType)
      if (itemsSemTipo.length > 0) {
        setError('Alguns itens não têm tipo definido. Recarregue a página e tente novamente.')
        setSubmitting(false)
        return
      }

      // Um único pedido com todos os itens; cada item envia seu lotId para o backend usar o preço do lote correto (feminino vs masculino)
      const payloadItems = itemsComTamanho.map(item => {
        const lotId = item.lotId != null ? String(item.lotId).trim() : ''
        return {
          itemType: item.itemType,
          size: item.itemType === 'ABADA' ? (item.size || 'Tamanho Único') : undefined,
          quantity: item.quantity,
          ...(lotId ? { lotId } : {}),
        }
      })

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
          },
          items: payloadItems,
        }),
      })

      if (!res.ok) {
        let errorMsg = `Erro ${res.status} ao criar pedido`
        try {
          const errorData = await res.json()
          errorMsg = errorData.error || errorMsg
          if (errorData.details) {
            errorMsg += `\n\nDetalhes: ${typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details)}`
          }
        } catch {
          const text = await res.text().catch(() => '')
          if (text) errorMsg += `\n\nResposta: ${text}`
        }
        throw new Error(errorMsg)
      }

      const data = await res.json()
      if (!data.paymentLink) {
        throw new Error(data.warning || 'Erro ao gerar link de pagamento. Tente novamente.')
      }

      if (data.orderId && typeof window !== 'undefined') {
        localStorage.setItem('vouali_recent_order_id', data.orderId)
      }
      setRedirectingToPayment(data.paymentLink)
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pedido')
    } finally {
      setSubmitting(false)
    }
  }, [name, phone, email, items, selectedLotIdMasculino, selectedLotIdFeminino, selectedLotesGenericos])

  // Abrir checkout do Mercado Pago em nova aba (apenas uma vez; evita duas abas por Strict Mode ou re-render)
  const paymentLinkOpenedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!redirectingToPayment) return
    if (paymentLinkOpenedRef.current === redirectingToPayment) return
    paymentLinkOpenedRef.current = redirectingToPayment
    const opened = window.open(redirectingToPayment, '_blank', 'noopener,noreferrer')
    if (!opened) {
      const t = setTimeout(() => { window.location.href = redirectingToPayment }, 1000)
      return () => clearTimeout(t)
    }
  }, [redirectingToPayment])

  if (redirectingToPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400 py-8 px-4">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-10 max-w-md mx-4">
          <div className="mb-6">
            <Logo size="large" showSubtitle={false} />
          </div>
          <p className="text-green-700 font-semibold mb-2">✓ Página de pagamento aberta em nova aba</p>
          <p className="text-gray-700 mb-2">Conclua o pagamento (Pix, cartão ou boleto) na aba do Mercado Pago.</p>
          <p className="text-gray-600 text-sm mb-6">
            Se a aba não abriu ou foi bloqueada, use o botão abaixo. Depois de pagar, você voltará automaticamente para nosso site.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={redirectingToPayment}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 transition"
            >
              Abrir pagamento no Mercado Pago
            </a>
            <button
              type="button"
              onClick={() => setRedirectingToPayment(null)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Voltar ao formulário
            </button>
          </div>
        </div>
      </div>
    )
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
          {/* Seletores de Lote - Masculino e Feminino */}
          {lots.length > 0 ? (() => {
            const lotMasculino = lots.find(l => getLotType(l.name) === 'MASCULINO')
            const lotFeminino = lots.find(l => getLotType(l.name) === 'FEMININO')
            const outrosLotes = lots.filter(l => {
              const tipo = getLotType(l.name)
              return tipo !== 'MASCULINO' && tipo !== 'FEMININO'
            })

            return (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Selecione os Lotes</h3>
                
                {/* Mensagem informativa se não houver lotes específicos */}
                {!lotMasculino && !lotFeminino && outrosLotes.length === 0 && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                    Nenhum lote encontrado. Verifique se há lotes ativos no painel admin.
                  </div>
                )}
                
                {/* Lote Masculino */}
                {lotMasculino && (
                  <div className={`p-4 rounded-lg border-2 ${selectedLotIdMasculino ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300'}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lote Masculino {selectedLotIdMasculino && <span className="text-green-600 font-bold">✓ Selecionado</span>}
                    </label>
                    <select
                      value={selectedLotIdMasculino || ''}
                      onChange={(e) => handleLoteMasculinoChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold bg-white"
                    >
                      <option value="">-- Não selecionar --</option>
                      <option value={lotMasculino.id}>
                        {lotMasculino.name} - Abadá: R$ {(lotMasculino.abadaPriceCents / 100).toFixed(2).replace('.', ',')}{lotMasculino.pulseiraPriceCents ? ` | ${lotMasculino.pulseiraName || 'Pulseira'}: R$ ${(lotMasculino.pulseiraPriceCents / 100).toFixed(2).replace('.', ',')}` : ''}
                      </option>
                    </select>
                  </div>
                )}
                
                {/* Lote Feminino */}
                {lotFeminino && (
                  <div className={`p-4 rounded-lg border-2 ${selectedLotIdFeminino ? 'bg-pink-50 border-pink-400' : 'bg-gray-50 border-gray-300'}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lote Feminino {selectedLotIdFeminino && <span className="text-green-600 font-bold">✓ Selecionado</span>}
                    </label>
                    <select
                      value={selectedLotIdFeminino || ''}
                      onChange={(e) => handleLoteFemininoChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-lg font-semibold bg-white"
                    >
                      <option value="">-- Não selecionar --</option>
                      <option value={lotFeminino.id}>
                        {lotFeminino.name} - Abadá: R$ {(lotFeminino.abadaPriceCents / 100).toFixed(2).replace('.', ',')}{lotFeminino.pulseiraPriceCents ? ` | ${lotFeminino.pulseiraName || 'Pulseira'}: R$ ${(lotFeminino.pulseiraPriceCents / 100).toFixed(2).replace('.', ',')}` : ''}
                      </option>
                    </select>
                  </div>
                )}
                
                {/* Lotes Genéricos (sem distinção de gênero) */}
                {outrosLotes.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-700">Lotes Disponíveis</h4>
                    {outrosLotes.map((lote) => {
                      const isSelected = selectedLotesGenericos.includes(lote.id)
                      return (
                        <div key={lote.id} className={`p-4 rounded-lg border-2 ${isSelected ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {lote.name} {isSelected && <span className="text-green-600 font-bold">✓ Selecionado</span>}
                            </label>
                            <button
                              type="button"
                              onClick={() => handleLoteGenericoChange(lote.id, !isSelected)}
                              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                isSelected 
                                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                              }`}
                            >
                              {isSelected ? 'Desmarcar' : 'Selecionar'}
                            </button>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Abadá: R$ {(lote.abadaPriceCents / 100).toFixed(2).replace('.', ',')}</p>
                            {lote.pulseiraPriceCents && (
                              <p>{lote.pulseiraName || 'Pulseira'}: R$ {(lote.pulseiraPriceCents / 100).toFixed(2).replace('.', ',')}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
                
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-semibold mb-1">
                    💡 Selecione os lotes e escolha manualmente os itens que deseja comprar!
                  </p>
                  <p className="text-xs text-blue-700">
                    Após selecionar um lote, use os botões abaixo para adicionar os itens que você deseja comprar.
                    Você tem controle total sobre o que adicionar ao seu pedido.
                  </p>
                </div>
              </div>
            )
          })() : (
            <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              Nenhum lote ativo encontrado. As vendas estão temporariamente indisponíveis.
            </div>
          )}

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

          {/* Escolha seus Itens */}
          <div>
            <h3 className="text-xl font-bold text-blue-900 mb-4">Escolha seus Itens</h3>
            
            {!selectedLotIdMasculino && !selectedLotIdFeminino && selectedLotesGenericos.length === 0 ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                Selecione pelo menos um lote acima para poder adicionar itens ao pedido.
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Adicione os itens que deseja comprar:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedLotIdMasculino && (() => {
                    const lotSelecionado = lots.find(l => l.id === selectedLotIdMasculino)
                    return lotSelecionado ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-blue-700">{lotSelecionado.name}:</p>
                        <button
                          type="button"
                          onClick={() => adicionarAbadaDoLote(selectedLotIdMasculino)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                        >
                          + Abadá (R$ {(lotSelecionado.abadaPriceCents / 100).toFixed(2).replace('.', ',')})
                        </button>
                        {lotSelecionado.pulseiraPriceCents && (
                          <button
                            type="button"
                            onClick={() => adicionarPulseiraDoLote(selectedLotIdMasculino)}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm"
                          >
                            + {lotSelecionado.pulseiraName || 'Pulseira Extra'} (R$ {(lotSelecionado.pulseiraPriceCents / 100).toFixed(2).replace('.', ',')})
                          </button>
                        )}
                      </div>
                    ) : null
                  })()}
                  
                  {selectedLotIdFeminino && (() => {
                    const lotSelecionado = lots.find(l => l.id === selectedLotIdFeminino)
                    return lotSelecionado ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-pink-700">{lotSelecionado.name}:</p>
                        <button
                          type="button"
                          onClick={() => adicionarAbadaDoLote(selectedLotIdFeminino)}
                          className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-semibold text-sm"
                        >
                          + Abadá (R$ {(lotSelecionado.abadaPriceCents / 100).toFixed(2).replace('.', ',')})
                        </button>
                        {lotSelecionado.pulseiraPriceCents && (
                          <button
                            type="button"
                            onClick={() => adicionarPulseiraDoLote(selectedLotIdFeminino)}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm"
                          >
                            + {lotSelecionado.pulseiraName || 'Pulseira Extra'} (R$ {(lotSelecionado.pulseiraPriceCents / 100).toFixed(2).replace('.', ',')})
                          </button>
                        )}
                      </div>
                    ) : null
                  })()}
                  
                  {/* Botões para lotes genéricos selecionados */}
                  {selectedLotesGenericos.map((lotId) => {
                    const lotSelecionado = lots.find(l => l.id === lotId)
                    return lotSelecionado ? (
                      <div key={lotId} className="space-y-2">
                        <p className="text-xs font-semibold text-green-700">{lotSelecionado.name}:</p>
                        <button
                          type="button"
                          onClick={() => adicionarAbadaDoLote(lotId)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                        >
                          + Abadá (R$ {(lotSelecionado.abadaPriceCents / 100).toFixed(2).replace('.', ',')})
                        </button>
                        {lotSelecionado.pulseiraPriceCents && (
                          <button
                            type="button"
                            onClick={() => adicionarPulseiraDoLote(lotId)}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm"
                          >
                            + {lotSelecionado.pulseiraName || 'Pulseira Extra'} (R$ {(lotSelecionado.pulseiraPriceCents / 100).toFixed(2).replace('.', ',')})
                          </button>
                        )}
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Itens do Pedido */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-blue-900">Itens do Pedido</h3>
            </div>

            {!selectedLotIdMasculino && !selectedLotIdFeminino && selectedLotesGenericos.length === 0 ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                Selecione pelo menos um lote acima para ver os itens do pedido.
              </div>
            ) : items.length === 0 ? (
              <div className="bg-gray-50 border-2 border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
                Carregando itens do lote...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Agrupar itens por lote para melhor visualização */}
                {(() => {
                  // Agrupar itens por lotId
                  const itemsPorLote = items.reduce((acc, item, index) => {
                    const lotId = item.lotId || 'sem-lote'
                    if (!acc[lotId]) {
                      acc[lotId] = []
                    }
                    acc[lotId].push({ item, index })
                    return acc
                  }, {} as Record<string, Array<{ item: Item; index: number }>>)
                  
                  // Renderizar grupos de itens por lote
                  return Object.entries(itemsPorLote).map(([lotId, grupoItens]) => {
                    const primeiroItem = grupoItens[0].item
                    const itemLot = primeiroItem.lotId ? lots.find(l => l.id === primeiroItem.lotId) || null : null
                    const lotType = itemLot ? getLotType(itemLot.name) : null
                    const lotTypeLabel = lotType === 'MASCULINO' ? 'Masculino' : lotType === 'FEMININO' ? 'Feminino' : null
                    const isMasculino = lotType === 'MASCULINO'
                    
                    return (
                      <div key={lotId} className={`space-y-3 ${lotType ? 'p-4 rounded-lg border-2' : ''} ${isMasculino ? 'bg-blue-50 border-blue-300' : 'bg-pink-50 border-pink-300'}`}>
                        {lotTypeLabel && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm font-bold px-3 py-1 rounded ${
                              isMasculino 
                                ? 'bg-blue-200 text-blue-900' 
                                : 'bg-pink-200 text-pink-900'
                            }`}>
                              📦 Lote {lotTypeLabel}
                            </span>
                            <span className="text-xs text-gray-600">
                              ({grupoItens.length} {grupoItens.length === 1 ? 'item' : 'itens'})
                            </span>
                          </div>
                        )}
                        {grupoItens.map(({ item, index: originalIndex }) => {
                          // Identificar itens do lote padrão: primeiro Abadá e primeira Pulseira de cada lote
                          const isPrimeiroAbadaDoLote = item.itemType === 'ABADA' && item.lotId && 
                            items.findIndex(i => i.itemType === 'ABADA' && i.lotId === item.lotId) === originalIndex
                          const isPrimeiraPulseiraDoLote = item.itemType === 'PULSEIRA_EXTRA' && item.lotId &&
                            items.findIndex(i => i.itemType === 'PULSEIRA_EXTRA' && i.lotId === item.lotId) === originalIndex
                          const isItemDoLote = isPrimeiroAbadaDoLote || isPrimeiraPulseiraDoLote
                  
                  return (
                  <div key={originalIndex} className={`border-2 rounded-lg p-4 ${isItemDoLote ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'} relative`}>
                    {/* Botão de remover no topo direito */}
                    <button
                      type="button"
                      onClick={() => removerItem(originalIndex)}
                      className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all transform hover:scale-110 z-10"
                      title="Remover este item"
                    >
                      ✕
                    </button>
                    
                    <div className="mb-2 flex items-center justify-between pr-10">
                      {isItemDoLote && (
                        <span className="text-xs font-semibold text-green-700">
                          ✓ Item do Lote
                        </span>
                      )}
                      {lotTypeLabel && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          lotType === 'MASCULINO' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {lotTypeLabel}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo *
                        </label>
                        {isItemDoLote ? (
                          <input
                            type="text"
                            value={item.itemType === 'ABADA' ? 'Abadá' : (itemLot?.pulseiraName || 'Pulseira Extra')}
                            disabled
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                          />
                        ) : (
                          <select
                            value={item.itemType === 'ABADA' && item.lotId ? `ABADA_${item.lotId}` : (item.itemType === 'PULSEIRA_EXTRA' ? 'PULSEIRA_EXTRA' : '')}
                            onChange={(e) => {
                              const value = e.target.value
                              const novosItems = [...items]
                              
                              if (value === 'PULSEIRA_EXTRA') {
                                novosItems[originalIndex] = {
                                  ...novosItems[originalIndex],
                                  itemType: 'PULSEIRA_EXTRA',
                                  lotId: selectedLotIdMasculino || selectedLotIdFeminino || selectedLotesGenericos[0] || lots[0]?.id,
                                  size: undefined
                                }
                              } else if (value.startsWith('ABADA_')) {
                                const lotId = value.replace('ABADA_', '')
                                novosItems[originalIndex] = {
                                  ...novosItems[originalIndex],
                                  itemType: 'ABADA',
                                  lotId: lotId,
                                  size: novosItems[originalIndex].size || 'Tamanho Único'
                                }
                              }
                              
                              setItems(novosItems)
                            }}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          >
                            {lots.map((lot) => (
                              <option key={`ABADA_${lot.id}`} value={`ABADA_${lot.id}`}>
                                {lot.name} - R$ {(lot.abadaPriceCents / 100).toFixed(2).replace('.', ',')}
                              </option>
                            ))}
                            {lots.length > 0 && lots[0].pulseiraPriceCents && (
                              <option value="PULSEIRA_EXTRA">
                                {lots[0].pulseiraName || 'Pulseira Extra'} - R$ {(lots[0].pulseiraPriceCents / 100).toFixed(2).replace('.', ',')}
                              </option>
                            )}
                          </select>
                        )}
                      </div>
                      {item.itemType === 'ABADA' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tamanho *
                          </label>
                          <input
                            type="text"
                            value={item.size || 'Tamanho Único'}
                            onChange={(e) => atualizarItem(originalIndex, 'size', e.target.value)}
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
                          onChange={(e) => atualizarItem(originalIndex, 'quantity', parseInt(e.target.value) || 1)}
                          required
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {itemLot && (
                          <>
                            Preço unitário: R$ {((item.itemType === 'ABADA' ? itemLot.abadaPriceCents : (itemLot.pulseiraPriceCents || 0)) / 100).toFixed(2).replace('.', ',')}
                            {' | '}
                            Subtotal: R$ {((item.itemType === 'ABADA' ? itemLot.abadaPriceCents : (itemLot.pulseiraPriceCents || 0)) * item.quantity / 100).toFixed(2).replace('.', ',')}
                          </>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removerItem(originalIndex)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-md ${
                          isItemDoLote 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-600' 
                            : 'bg-red-500 hover:bg-red-600 text-white border-2 border-red-600'
                        }`}
                        title="Clique para remover este item do pedido"
                      >
                        🗑️ Remover
                      </button>
                    </div>
                  </div>
                  )
                })}
                      </div>
                    )
                  })
                })()}
              </div>
            )}
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
