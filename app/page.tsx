'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/app/components/Logo'
import PromoMediaCarousel, { PromoCardMedia } from '@/app/components/PromoMediaCarousel'

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

export default function HomePage() {
  const [promoCards, setPromoCards] = useState<PromoCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    
    async function fetchCards() {
      try {
        const res = await fetch('/api/promo-cards?placement=HOME')
        if (cancelled) return
        
        if (res.ok) {
          const cards = await res.json()
          if (!cancelled) {
            setPromoCards(cards || [])
          }
        } else {
          console.error('Erro ao carregar cards:', res.status)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Erro ao carregar cards:', err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    fetchCards()
    
    return () => {
      cancelled = true
    }
  }, [])

  const percursoCard = promoCards.find((c) =>
    (c.title || '').toLowerCase().includes('percurso')
  )
  const highlightCards = percursoCard
    ? promoCards.filter((c) => c.id !== percursoCard.id)
    : promoCards

  return (
    <div className="min-h-screen relative bg-[linear-gradient(180deg,#ffffff_0%,#f6f7f9_50%,#ffffff_100%)]">
      {/* Faixa Brasil */}
      <div className="h-2 w-full bg-[linear-gradient(90deg,#1f9d55_0%,#1f9d55_33%,#f6c700_33%,#f6c700_66%,#1e3a8a_66%,#1e3a8a_100%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-white border border-[#dee2e6] rounded-3xl p-6 sm:p-10">
          {/* fundo com cores do abadá (bem suave) */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#1f9d55_0%,#f6c700_45%,#1e3a8a_100%)] opacity-[0.10]" />
          <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-[#1f9d55] opacity-[0.08]" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-[#1e3a8a] opacity-[0.06]" />

          <div className="text-center">
            <div className="inline-block mb-4">
              <Logo size="large" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Esse é o último!
            </h1>
            <p className="text-base sm:text-lg text-gray-700 mb-6">
              Garanta seu Abadá do Bloco Vou Ali
            </p>
            <Link
              href="/comprar"
              className="inline-block px-8 py-4 bg-[#1f9d55] text-white rounded-xl hover:bg-[#188a49] font-bold text-lg shadow transition-all border border-[#0f6b35]"
            >
              Comprar Agora
            </Link>
          </div>
        </div>
      </div>

      {/* Cards Promocionais */}
      {!loading && highlightCards.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">
            Destaques
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlightCards.map((card) => {
              const cardLink = card.linkEnabled 
                ? (card.linkUrl || '/comprar')
                : null
              
              const CardContent = (
                <div
                  className="bg-white rounded-2xl shadow-sm border border-[#dee2e6] overflow-hidden transition-all hover:shadow-md"
                  style={{
                    backgroundColor: card.backgroundColor || '#ffffff',
                    color: card.textColor || '#333333',
                    cursor: cardLink ? 'pointer' : 'default',
                  }}
                >
                  {Array.isArray(card.media) && card.media.length > 0 ? (
                    <div className="p-4 pb-0">
                      <PromoMediaCarousel
                        media={card.media}
                        autoPlay={card.autoPlay ?? true}
                        intervalMs={card.slideInterval ?? 5000}
                        altBase={card.title}
                      />
                    </div>
                  ) : card.imageUrl ? (
                    <div className="relative overflow-hidden">
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className="w-full h-56 object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                    <p className="text-sm mb-4 line-clamp-3">{card.content}</p>
                    {cardLink && (
                      <div className="flex items-center text-sm font-semibold text-[#1f9d55]">
                        <span>Ver / Comprar</span>
                        <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              )

              if (cardLink) {
                return (
                  <Link
                    key={card.id}
                    href={cardLink}
                    className="block group"
                  >
                    {CardContent}
                  </Link>
                )
              }

              return (
                <div key={card.id} className="block group">
                  {CardContent}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Galeria (a partir das mídias dos cards HOME) */}
      {!loading && highlightCards.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">
            Galeria do Evento
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {highlightCards
              .flatMap((c) => (Array.isArray(c.media) ? c.media : []))
              .filter((m) => m.mediaType === 'image')
              .slice(0, 8)
              .map((m, idx) => (
                <Link
                  key={`${m.mediaUrl}-${idx}`}
                  href="/comprar"
                  className="block rounded-2xl border border-[#dee2e6] overflow-hidden bg-white hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-[#f8f9fa]">
                    <img
                      src={m.mediaUrl}
                      alt="Galeria"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </Link>
              ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Dica: envie as artes (percurso, mockup do abadá, logo 2026) como mídias de um card marcado para “Somente Inicial”.
          </p>
        </div>
      )}

      {/* Percurso do Bloco */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white border border-[#dee2e6] rounded-3xl p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Percurso do bloco
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Saída</h3>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
                    <li>Confraria do Rei</li>
                    <li>Prof. Sandoval Arroxelas</li>
                    <li>José Júlio Sawer</li>
                    <li>Rua Prefeito Abdon Arroxelas</li>
                    <li>R. Manoel Ribeiro da Rocha</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Chegada</h3>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
                    <li>Av. Eng. Paulo Brandão Nogueira</li>
                  </ul>

                  <div className="mt-4">
                    <a
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-gray-700"
                      href="https://www.google.com/maps/search/?api=1&query=Av.%20Eng.%20Paulo%20Brand%C3%A3o%20Nogueira"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir no Google Maps
                      <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-5">
                Observação: percurso sujeito a ajustes pela organização.
              </p>
            </div>

            {/* Imagem ao lado do percurso (vinda de um card com "percurso" no título) */}
            <div>
              {percursoCard && (Array.isArray(percursoCard.media) && percursoCard.media.length > 0) ? (
                <PromoMediaCarousel
                  media={percursoCard.media}
                  autoPlay={false}
                  intervalMs={percursoCard.slideInterval ?? 5000}
                  altBase={percursoCard.title}
                />
              ) : percursoCard?.imageUrl ? (
                <div className="rounded-xl border border-[#dee2e6] overflow-hidden bg-white">
                  <div className="aspect-[3/4] bg-[#f8f9fa]">
                    <img
                      src={percursoCard.imageUrl}
                      alt={percursoCard.title}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#dee2e6] bg-[#f8f9fa] p-6 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 mb-2">Quer colocar a imagem do percurso aqui?</p>
                  <p>
                    No admin, crie um card com título contendo <span className="font-mono">Percurso</span> e envie essa foto como mídia.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="bg-white border border-[#dee2e6] rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#1f9d55_0%,#f6c700_45%,#1e3a8a_100%)] opacity-[0.07]" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Não perca essa oportunidade!
          </h2>
          <p className="text-base sm:text-lg text-gray-700 mb-6">
            Garanta seu Abadá do Bloco Vou Ali e faça parte dessa festa incrível
          </p>
          <Link
            href="/comprar"
            className="inline-block px-8 py-4 bg-[#1e3a8a] text-white rounded-xl hover:bg-[#17306f] font-bold text-lg shadow transition-all border border-[#12285e]"
          >
            Comprar Meu Abadá Agora
          </Link>
        </div>
      </div>
    </div>
  )
}
