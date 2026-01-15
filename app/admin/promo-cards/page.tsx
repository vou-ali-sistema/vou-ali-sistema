'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface PromoCardMedia {
  id: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  displayOrder: number
}

interface PromoCard {
  id: string
  title: string
  content: string
  imageUrl: string | null
  active: boolean
  displayOrder: number
  backgroundColor: string | null
  textColor: string | null
  autoPlay: boolean
  slideInterval: number
  linkEnabled: boolean
  linkUrl: string | null
  placement: 'HOME' | 'COMPRAR' | 'BOTH'
  comprarSlot: 'TOP' | 'BOTTOM' | null
  media?: PromoCardMedia[]
  createdAt: string
  updatedAt: string
}

export default function PromoCardsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cards, setCards] = useState<PromoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCard, setEditingCard] = useState<PromoCard | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    active: true,
    displayOrder: 0,
    backgroundColor: '#f8f9fa',
    textColor: '#333333',
    autoPlay: true,
    slideInterval: 5000,
    linkEnabled: true,
    linkUrl: '',
    placement: 'BOTH' as 'HOME' | 'COMPRAR' | 'BOTH',
    comprarSlot: '' as '' | 'TOP' | 'BOTTOM',
  })
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [cardMedia, setCardMedia] = useState<PromoCardMedia[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCards()
    }
  }, [status])

  async function fetchCards() {
    try {
      const res = await fetch('/api/admin/promo-cards')
      if (!res.ok) throw new Error('Erro ao carregar cards')
      const data = await res.json()
      setCards(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function openModal(card?: PromoCard) {
    if (card) {
      setEditingCard(card)
      setFormData({
        title: card.title,
        content: card.content,
        imageUrl: card.imageUrl || '',
        active: card.active,
        displayOrder: card.displayOrder,
        backgroundColor: card.backgroundColor || '#f8f9fa',
        textColor: card.textColor || '#333333',
        autoPlay: card.autoPlay ?? true,
        slideInterval: card.slideInterval ?? 5000,
        linkEnabled: card.linkEnabled ?? true,
        linkUrl: card.linkUrl || '',
        placement: (card.placement || 'BOTH') as 'HOME' | 'COMPRAR' | 'BOTH',
        comprarSlot: (card.comprarSlot || '') as '' | 'TOP' | 'BOTTOM',
      })
      setPreviewImage(card.imageUrl || null)
      
      // Carregar mídias do card
      try {
        const res = await fetch(`/api/admin/promo-cards/${card.id}/media`)
        if (res.ok) {
          const media = await res.json()
          setCardMedia(media)
        } else {
          setCardMedia([])
        }
      } catch (err) {
        console.error('Erro ao carregar mídias:', err)
        setCardMedia([])
      }
    } else {
      setEditingCard(null)
      setFormData({
        title: '',
        content: '',
        imageUrl: '',
        active: true,
        displayOrder: 0,
        backgroundColor: '#f8f9fa',
        textColor: '#333333',
        autoPlay: true,
        slideInterval: 5000,
        linkEnabled: true,
        linkUrl: '',
        placement: 'BOTH',
        comprarSlot: '',
      })
      setPreviewImage(null)
      setCardMedia([])
    }
    setShowModal(true)
    setError('')
  }

  function closeModal() {
    setShowModal(false)
    setEditingCard(null)
    setError('')
    setPreviewImage(null)
    setCardMedia([])
  }

  async function handleAddMedia(file: File, mediaType: 'image' | 'video') {
    if (!editingCard) {
      setError('Salve o card primeiro antes de adicionar mídias')
      return
    }

    setUploadingMedia(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      const uploadData = await uploadRes.json()

      // Adicionar mídia ao card
      const mediaRes = await fetch(`/api/admin/promo-cards/${editingCard.id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl: uploadData.url,
          mediaType: mediaType,
          displayOrder: cardMedia.length,
        }),
      })

      if (!mediaRes.ok) {
        throw new Error('Erro ao adicionar mídia ao card')
      }

      const newMedia = await mediaRes.json()
      setCardMedia([...cardMedia, newMedia])
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar mídia')
    } finally {
      setUploadingMedia(false)
    }
  }

  async function handleRemoveMedia(mediaId: string) {
    if (!editingCard) return

    try {
      const res = await fetch(`/api/admin/promo-cards/${editingCard.id}/media/${mediaId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao remover mídia')

      setCardMedia(cardMedia.filter(m => m.id !== mediaId))
    } catch (err: any) {
      setError(err.message || 'Erro ao remover mídia')
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WEBP')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Tamanho máximo: 5MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      const data = await res.json()
      setFormData(prev => ({ ...prev, imageUrl: data.url }))
      setPreviewImage(data.url)
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      const url = editingCard
        ? `/api/admin/promo-cards/${editingCard.id}`
        : '/api/admin/promo-cards'
      
      const method = editingCard ? 'PUT' : 'POST'

      const payload = {
        title: formData.title,
        content: formData.content,
        imageUrl: formData.imageUrl || '',
        active: formData.active,
        displayOrder: formData.displayOrder,
        backgroundColor: formData.backgroundColor || '',
        textColor: formData.textColor || '',
        autoPlay: formData.autoPlay ?? true,
        slideInterval: formData.slideInterval ?? 5000,
        linkEnabled: formData.linkEnabled ?? true,
        linkUrl: formData.linkUrl || '',
        placement: formData.placement,
        comprarSlot: formData.comprarSlot || '',
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        console.error('Erro ao salvar card:', data)
        const errorMsg = data.error || 'Erro ao salvar card'
        const details = data.details ? `\n\nDetalhes: ${JSON.stringify(data.details, null, 2)}` : ''
        throw new Error(errorMsg + details)
      }

      closeModal()
      fetchCards()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este card?')) return

    try {
      const res = await fetch(`/api/admin/promo-cards/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao excluir card')

      fetchCards()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      const card = cards.find(c => c.id === id)
      if (!card) return

      const res = await fetch(`/api/admin/promo-cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: card.title,
          content: card.content,
          imageUrl: card.imageUrl || '',
          active: !currentActive,
          displayOrder: card.displayOrder,
          backgroundColor: card.backgroundColor || '',
          textColor: card.textColor || '',
          autoPlay: card.autoPlay ?? true,
          slideInterval: card.slideInterval ?? 5000,
          linkEnabled: card.linkEnabled ?? true,
          linkUrl: card.linkUrl || '',
          placement: card.placement || 'BOTH',
          comprarSlot: card.comprarSlot || '',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao atualizar card')
      }

      fetchCards()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Cards de Divulgação</h1>
          <p className="text-gray-600">Gerencie os cards exibidos na página de compra</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-lg transition-all"
        >
          + Novo Card
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">Nenhum card cadastrado ainda.</p>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            Criar Primeiro Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden"
              style={{
                backgroundColor: card.backgroundColor || '#f8f9fa',
                color: card.textColor || '#333333',
              }}
            >
              {card.imageUrl && (
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{card.title}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      card.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {card.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-sm mb-4 line-clamp-3">{card.content}</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => openModal(card)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActive(card.id, card.active)}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      card.active
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {card.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
                  >
                    Excluir
                  </button>
                </div>
                <p className="text-xs mt-3 opacity-70">
                  Ordem: {card.displayOrder}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b-2 border-gray-200">
              <h2 className="text-2xl font-bold text-blue-900">
                {editingCard ? 'Editar Card' : 'Novo Card'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Bloco Vou Ali 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conteúdo *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Descreva o evento, informações importantes, etc..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagem (opcional)
                </label>
                
                {/* Informações sobre tamanho ideal */}
                <div className="mb-3 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                  <p className="text-sm font-semibold text-gray-800 mb-1">
                    📐 Tamanho Ideal da Imagem:
                  </p>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
                    <li><strong>Largura:</strong> 800px a 1200px (recomendado: 1000px)</li>
                    <li><strong>Altura:</strong> 400px a 600px (recomendado: 500px)</li>
                    <li><strong>Proporção:</strong> 2:1 (largura é o dobro da altura)</li>
                    <li><strong>Formato:</strong> JPG, PNG, GIF ou WEBP</li>
                    <li><strong>Tamanho máximo:</strong> 5MB</li>
                  </ul>
                  <p className="text-xs text-gray-600 mt-2 italic">
                    💡 Dica: Imagens muito grandes ou muito pequenas podem não ficar com boa aparência. Use o tamanho recomendado para melhor resultado!
                  </p>
                </div>
                
                {/* Preview da imagem */}
                {previewImage && (
                  <div className="mb-3">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, imageUrl: '' }))
                        setPreviewImage(null)
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 font-semibold"
                    >
                      Remover Imagem
                    </button>
                  </div>
                )}

                {/* Upload de arquivo */}
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  />
                  {uploading && (
                    <p className="text-sm text-blue-600 mt-1">Fazendo upload...</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos aceitos: JPG, PNG, GIF, WEBP. Tamanho máximo: 5MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor de Fundo
                  </label>
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="w-full h-10 border-2 border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor do Texto
                  </label>
                  <input
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    className="w-full h-10 border-2 border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cards com menor número aparecem primeiro
                  </p>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Card Ativo
                    </span>
                  </label>
                </div>
              </div>

              {/* Onde aparece */}
              <div className="border-t-2 border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📍 Onde o card aparece</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Página
                    </label>
                    <select
                      value={formData.placement}
                      onChange={(e) => {
                        const placement = e.target.value as 'HOME' | 'COMPRAR' | 'BOTH'
                        setFormData(prev => ({
                          ...prev,
                          placement,
                          comprarSlot: placement === 'HOME' ? '' : prev.comprarSlot,
                        }))
                      }}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="BOTH">Inicial + Comprar</option>
                      <option value="HOME">Somente Inicial</option>
                      <option value="COMPRAR">Somente Comprar</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Controle se o card aparece na home, na página de compra, ou nas duas.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posição no /comprar
                    </label>
                    <select
                      value={formData.comprarSlot}
                      onChange={(e) => setFormData({ ...formData, comprarSlot: e.target.value as any })}
                      disabled={!(formData.placement === 'COMPRAR' || formData.placement === 'BOTH')}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <option value="">Automático</option>
                      <option value="TOP">Em cima do formulário</option>
                      <option value="BOTTOM">Embaixo do formulário</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Se deixar “Automático”, o sistema preenche o espaço que estiver faltando.
                    </p>
                  </div>
                </div>
              </div>

              {/* Configurações de Link */}
              <div className="border-t-2 border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🔗 Configurações de Link</h3>
                
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.linkEnabled}
                      onChange={(e) => setFormData({ ...formData, linkEnabled: e.target.checked })}
                      className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Card clicável (com link)
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Se desmarcado, o card não será clicável
                  </p>
                </div>

                {formData.linkEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL do Link (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      placeholder="/comprar ou https://exemplo.com"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Deixe vazio para usar o link padrão (/comprar). Use URLs relativas (ex: /comprar) ou completas (ex: https://exemplo.com)
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  {editingCard ? 'Salvar Alterações' : 'Criar Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
