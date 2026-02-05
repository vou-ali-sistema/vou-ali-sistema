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
  // Estados separados para lotes masculino e feminino
  const [selectedLotIdMasculino, setSelectedLotIdMasculino] = useState<string | null>(null)
  const [selectedLotIdFeminino, setSelectedLotIdFeminino] = useState<string | null>(null)
  const [promoCards, setPromoCards] = useState<PromoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [purchaseEnabled, setPurchaseEnabled] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
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

  // Função para adicionar itens de um lote ao carrinho (sem remover itens de outros lotes)
  // NOTA: Esta função não é mais usada diretamente - os handlers fazem isso diretamente
  const adicionarItensDoLote = (lotId: string) => {
    const lot = lots.find(l => l.id === lotId)
    if (!lot) return

    // Verificar se já existem itens padrão deste lote no carrinho
    const existingItemsFromLot = items.filter(item => item.lotId === lotId)
    
    // Se já existem itens deste lote, não adicionar novamente
    if (existingItemsFromLot.length > 0) return

    // Um lote sempre contém: 1 Abadá + 1 Pulseira Extra
    const novosItens: Item[] = [
      {
        itemType: 'ABADA',
        size: 'Tamanho Único',
        quantity: 1,
        lotId: lotId
      },
      {
        itemType: 'PULSEIRA_EXTRA',
        quantity: 1,
        lotId: lotId
      }
    ]
    // Adicionar ao invés de substituir
    setItems(prevItems => [...prevItems, ...novosItens])
  }

  // Função para remover itens de um lote específico
  // NOTA: Esta função não é mais usada diretamente - os handlers fazem isso diretamente
  const removerItensDoLote = (lotId: string) => {
    setItems(prevItems => prevItems.filter(item => item.lotId !== lotId))
  }

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
          
          // Separar lotes por tipo
          const lotMasculino = activeLots.find(l => getLotType(l.name) === 'MASCULINO')
          const lotFeminino = activeLots.find(l => getLotType(l.name) === 'FEMININO')
          
          // Inicializar seleções e itens se ainda não foram selecionados
          if (!selectedLotIdMasculino && !selectedLotIdFeminino) {
            const novosItens: Item[] = []
            
            if (lotMasculino) {
              setSelectedLotIdMasculino(lotMasculino.id)
              novosItens.push(
                { itemType: 'ABADA', size: 'Tamanho Único', quantity: 1, lotId: lotMasculino.id },
                { itemType: 'PULSEIRA_EXTRA', quantity: 1, lotId: lotMasculino.id }
              )
            }
            
            if (lotFeminino) {
              setSelectedLotIdFeminino(lotFeminino.id)
              novosItens.push(
                { itemType: 'ABADA', size: 'Tamanho Único', quantity: 1, lotId: lotFeminino.id },
                { itemType: 'PULSEIRA_EXTRA', quantity: 1, lotId: lotFeminino.id }
              )
            }
            
            if (novosItens.length > 0) {
              setItems(novosItens)
            }
          }
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
  
  // Adicionar abadá extra de um lote específico
  function adicionarAbadaDoLote(lotId: string) {
    const lot = lots.find(l => l.id === lotId)
    if (!lot) return
    
    setItems([...items, { 
      itemType: 'ABADA', 
      size: 'Tamanho Único', 
      quantity: 1, 
      lotId: lotId 
    }])
  }

  // Handler para mudança de lote masculino
  function handleLoteMasculinoChange(lotId: string) {
    const lotAnterior = selectedLotIdMasculino
    
    // Atualizar estado primeiro
    setSelectedLotIdMasculino(lotId)
    
    // Usar setItems com função para garantir que a atualização seja atômica
    setItems(prevItems => {
      // Se não havia lote anterior, apenas adicionar itens do novo lote
      if (!lotAnterior) {
        if (!lotId) return prevItems
        
        const lot = lots.find(l => l.id === lotId)
        if (!lot) return prevItems
        
        // Verificar se já existem itens deste lote
        const jaExistemItensDesteLote = prevItems.some(item => item.lotId === lotId)
        if (jaExistemItensDesteLote) return prevItems
        
        // Adicionar itens padrão do novo lote
        return [
          ...prevItems,
          { itemType: 'ABADA', size: 'Tamanho Único', quantity: 1, lotId: lotId },
          { itemType: 'PULSEIRA_EXTRA', quantity: 1, lotId: lotId }
        ]
      }
      
      // Se havia lote anterior, substituir apenas os itens padrão e atualizar extras
      if (!lotId) {
        // Se desmarcou o lote, remover apenas os itens padrão (primeiro Abadá + primeira Pulseira)
        const primeiroAbadaIdx = prevItems.findIndex(item => 
          item.lotId === lotAnterior && item.itemType === 'ABADA'
        )
        const primeiraPulseiraIdx = prevItems.findIndex(item => 
          item.lotId === lotAnterior && item.itemType === 'PULSEIRA_EXTRA'
        )
        
        return prevItems.filter((item, idx) => 
          idx !== primeiroAbadaIdx && idx !== primeiraPulseiraIdx
        )
      }
      
      // Trocar de lote: atualizar lotId dos itens do lote anterior para o novo lote
      const lot = lots.find(l => l.id === lotId)
      if (!lot) return prevItems
      
      // Verificar se já existem itens do novo lote
      const jaExistemItensDoNovoLote = prevItems.some(item => item.lotId === lotId)
      
      return prevItems.map(item => {
        // Atualizar lotId dos itens do lote anterior para o novo lote
        if (item.lotId === lotAnterior) {
          return { ...item, lotId: lotId }
        }
        return item
      }).concat(
        // Se não existem itens do novo lote, adicionar os padrão
        jaExistemItensDoNovoLote ? [] : [
          { itemType: 'ABADA', size: 'Tamanho Único', quantity: 1, lotId: lotId },
          { itemType: 'PULSEIRA_EXTRA', quantity: 1, lotId: lotId }
        ]
      )
    })
  }

  // Handler para mudança de lote feminino
  function handleLoteFemininoChange(lotId: string) {
    const lotAnterior = selectedLotIdFeminino
    
    // Atualizar estado primeiro
    setSelectedLotIdFeminino(lotId)
    
    // Usar setItems com função para garantir que a atualização seja atômica
    setItems(prevItems => {
      // Se não havia lote anterior, apenas adicionar itens do novo lote
      if (!lotAnterior) {
        if (!lotId) return prevItems
        
        const lot = lots.find(l => l.id === lotId)
        if (!lot) return prevItems
        
        // Verificar se já existem itens deste lote
        const jaExistemItensDesteLote = prevItems.some(item => item.lotId === lotId)
        if (jaExistemItensDesteLote) return prevItems
        
        // Adicionar itens padrão do novo lote
        return [
          ...prevItems,
          { itemType: 'ABADA', size: 'Tamanho Único', quantity: 1, lotId: lotId },
          { itemType: 'PULSEIRA_EXTRA', quantity: 1, lotId: lotId }
        ]
      }
      
      // Se havia lote anterior, substituir apenas os itens padrão e atualizar extras
      if (!lotId) {
        // Se desmarcou o lote, remover apenas os itens padrão (primeiro Abadá + primeira Pulseira)
        const primeiroAbadaIdx = prevItems.findIndex(item => 
          item.lotId === lotAnterior && item.itemType === 'ABADA'
        )
        const primeiraPulseiraIdx = prevItems.findIndex(item => 
          item.lotId === lotAnterior && item.itemType === 'PULSEIRA_EXTRA'
        )
        
        return prevItems.filter((item, idx) => 
          idx !== primeiroAbadaIdx && idx !== primeiraPulseiraIdx
        )
      }
      
      // Trocar de lote: atualizar lotId dos itens do lote anterior para o novo lote
      const lot = lots.find(l => l.id === lotId)
      if (!lot) return prevItems
      
      // Verificar se já existem itens do novo lote
      const jaExistemItensDoNovoLote = prevItems.some(item => item.lotId === lotId)
      
      return prevItems.map(item => {
        // Atualizar lotId dos itens do lote anterior para o novo lote
        if (item.lotId === lotAnterior) {
          return { ...item, lotId: lotId }
        }
        return item
      }).concat(
        // Se não existem itens do novo lote, adicionar os padrão
        jaExistemItensDoNovoLote ? [] : [
          { itemType: 'ABADA', size: 'Tamanho Único', quantity: 1, lotId: lotId },
          { itemType: 'PULSEIRA_EXTRA', quantity: 1, lotId: lotId }
        ]
      )
    })
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
  // Cada item pode ter seu próprio lote - sempre usar o lote correto do item
  const total = useMemo(() => {
    if (lots.length === 0) return 0
    return items.reduce((sum, item) => {
      // Sempre buscar o lote correto do item - nunca usar fallback
      const itemLot = item.lotId ? lots.find(l => l.id === item.lotId) : null
      if (!itemLot) return sum // Se não encontrar o lote, não adicionar ao total
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
      // Validar que pelo menos um lote foi selecionado
      if (!selectedLotIdMasculino && !selectedLotIdFeminino) {
        setError('Selecione pelo menos um lote (masculino ou feminino) para continuar')
        setSubmitting(false)
        return
      }

      // Validar que há pelo menos um item
      if (items.length === 0) {
        setError('Nenhum item encontrado. Selecione um lote para adicionar itens ao pedido.')
        setSubmitting(false)
        return
      }

      // Validar que todos os itens têm lote selecionado
      const itemsSemLote = items.filter(item => !item.lotId)
      if (itemsSemLote.length > 0) {
        setError('Alguns itens não têm lote associado. Recarregue a página e tente novamente.')
        setSubmitting(false)
        return
      }

      // Validar que todos os itens têm tipo válido
      const itemsSemTipo = items.filter(item => !item.itemType)
      if (itemsSemTipo.length > 0) {
        setError('Alguns itens não têm tipo definido. Recarregue a página e tente novamente.')
        setSubmitting(false)
        return
      }

      // Agrupar itens por lote
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

      // Criar pedidos separados para cada lote selecionado
      const lotIds = Object.keys(itemsByLot)
      const pedidosCriados: Array<{ lotId: string; paymentLink: string; orderId?: string }> = []
      let primeiroErro: string | null = null

      for (const lotId of lotIds) {
        try {
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer: {
                name: name.trim(),
                phone: phone.trim(),
                email: email.trim(),
              },
              items: itemsByLot[lotId],
              lotId: lotId,
            }),
          })

          if (!res.ok) {
            let errorMsg = `Erro ${res.status} ao criar pedido para lote`
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
            if (!primeiroErro) primeiroErro = errorMsg
            continue // Continuar tentando criar os outros pedidos
          }

          const data = await res.json()
          if (data.paymentLink) {
            pedidosCriados.push({ lotId, paymentLink: data.paymentLink, orderId: data.orderId })
          } else {
            if (!primeiroErro) {
              primeiroErro = data.warning || 'Erro ao gerar link de pagamento para um dos lotes.'
            }
          }
        } catch (err: any) {
          if (!primeiroErro) {
            primeiroErro = err.message || 'Erro ao criar pedido'
          }
        }
      }

      // Se pelo menos um pedido foi criado com sucesso, redirecionar para o primeiro link de pagamento
      if (pedidosCriados.length > 0) {
        // Se houver múltiplos pedidos, redirecionar para o primeiro
        // O usuário poderá pagar os outros pedidos depois através do email
        window.location.href = pedidosCriados[0].paymentLink
      } else {
        // Se nenhum pedido foi criado, mostrar erro
        throw new Error(primeiroErro || 'Erro ao criar pedidos. Nenhum pedido foi criado com sucesso.')
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
          {/* Seletores de Lote - Masculino e Feminino */}
          {lots.length > 0 && (() => {
            const lotMasculino = lots.find(l => getLotType(l.name) === 'MASCULINO')
            const lotFeminino = lots.find(l => getLotType(l.name) === 'FEMININO')
            
            return (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Selecione os Lotes</h3>
                
                {/* Lote Masculino */}
                {lotMasculino && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lote Masculino
                    </label>
                    <select
                      value={selectedLotIdMasculino || ''}
                      onChange={(e) => handleLoteMasculinoChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold bg-white"
                    >
                      <option value="">-- Não selecionar --</option>
                      <option value={lotMasculino.id}>
                        {lotMasculino.name} - Abadá: R$ {(lotMasculino.abadaPriceCents / 100).toFixed(2).replace('.', ',')} | Pulseira: R$ {(lotMasculino.pulseiraPriceCents / 100).toFixed(2).replace('.', ',')}
                      </option>
                    </select>
                  </div>
                )}
                
                {/* Lote Feminino */}
                {lotFeminino && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lote Feminino
                    </label>
                    <select
                      value={selectedLotIdFeminino || ''}
                      onChange={(e) => handleLoteFemininoChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold bg-white"
                    >
                      <option value="">-- Não selecionar --</option>
                      <option value={lotFeminino.id}>
                        {lotFeminino.name} - Abadá: R$ {(lotFeminino.abadaPriceCents / 100).toFixed(2).replace('.', ',')} | Pulseira: R$ {(lotFeminino.pulseiraPriceCents / 100).toFixed(2).replace('.', ',')}
                      </option>
                    </select>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Você pode selecionar ambos os lotes para comprar masculino e feminino ao mesmo tempo. Cada lote inclui automaticamente: 1 Abadá + 1 Pulseira Extra. Você pode adicionar itens extras se necessário.
                </p>
              </div>
            )
          })()}

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

          {/* Itens do Pedido */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-blue-900">Itens do Pedido</h3>
              {(selectedLotIdMasculino || selectedLotIdFeminino) && (
                <div className="flex gap-2">
                  {selectedLotIdMasculino && (
                    <button
                      type="button"
                      onClick={() => adicionarAbadaDoLote(selectedLotIdMasculino)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                      title="Adicionar mais um Abadá do lote masculino"
                    >
                      + Abadá Masculino
                    </button>
                  )}
                  {selectedLotIdFeminino && (
                    <button
                      type="button"
                      onClick={() => adicionarAbadaDoLote(selectedLotIdFeminino)}
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-semibold text-sm"
                      title="Adicionar mais um Abadá do lote feminino"
                    >
                      + Abadá Feminino
                    </button>
                  )}
                </div>
              )}
            </div>

            {!selectedLotIdMasculino && !selectedLotIdFeminino ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                Selecione pelo menos um lote (masculino ou feminino) acima para ver os itens do pedido.
              </div>
            ) : items.length === 0 ? (
              <div className="bg-gray-50 border-2 border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
                Carregando itens do lote...
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => {
                  // Sempre buscar o lote correto do item - nunca usar fallback para lots[0]
                  const itemLot = item.lotId ? lots.find(l => l.id === item.lotId) || null : null
                  // Identificar itens do lote padrão: primeiro Abadá e primeira Pulseira de cada lote
                  const lotIdDoItem = item.lotId
                  const isPrimeiroAbadaDoLote = item.itemType === 'ABADA' && lotIdDoItem && 
                    items.findIndex(i => i.itemType === 'ABADA' && i.lotId === lotIdDoItem) === index
                  const isPrimeiraPulseiraDoLote = item.itemType === 'PULSEIRA_EXTRA' && lotIdDoItem &&
                    items.findIndex(i => i.itemType === 'PULSEIRA_EXTRA' && i.lotId === lotIdDoItem) === index
                  const isItemDoLote = isPrimeiroAbadaDoLote || isPrimeiraPulseiraDoLote
                  
                  // Identificar o tipo do lote para exibição
                  const lotType = itemLot ? getLotType(itemLot.name) : null
                  const lotTypeLabel = lotType === 'MASCULINO' ? 'Masculino' : lotType === 'FEMININO' ? 'Feminino' : null
                  
                  return (
                  <div key={index} className={`border-2 rounded-lg p-4 ${isItemDoLote ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                    <div className="mb-2 flex items-center justify-between">
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
                            value={item.itemType === 'ABADA' ? 'Abadá' : 'Pulseira Extra'}
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
                                novosItems[index] = {
                                  ...novosItems[index],
                                  itemType: 'PULSEIRA_EXTRA',
                                  lotId: selectedLotIdMasculino || selectedLotIdFeminino || lots[0]?.id,
                                  size: undefined
                                }
                              } else if (value.startsWith('ABADA_')) {
                                const lotId = value.replace('ABADA_', '')
                                novosItems[index] = {
                                  ...novosItems[index],
                                  itemType: 'ABADA',
                                  lotId: lotId,
                                  size: novosItems[index].size || 'Tamanho Único'
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
                            {lots.length > 0 && (
                              <option value="PULSEIRA_EXTRA">
                                Pulseira Extra - R$ {(lots[0].pulseiraPriceCents / 100).toFixed(2).replace('.', ',')}
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

                    {!isItemDoLote && (
                      <button
                        type="button"
                        onClick={() => removerItem(index)}
                        className="mt-2 text-sm text-red-600 hover:text-red-900 font-semibold"
                      >
                        Remover Item Extra
                      </button>
                    )}
                  </div>
                  )
                })}
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
