'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/app/components/Logo'

interface PromoCard {
  id: string
  title: string
  content: string
  imageUrl: string | null
  backgroundColor: string | null
  textColor: string | null
  linkEnabled: boolean
  linkUrl: string | null
  placement: 'HOME' | 'COMPRAR' | 'BOTH'
  comprarSlot: 'TOP' | 'BOTTOM' | null
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Hero Section */}
        <div className="bg-[#f8f9fa] border border-[#dee2e6] rounded-3xl p-6 sm:p-10">
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
              className="inline-block px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-bold text-lg shadow transition-all"
            >
              Comprar Agora
            </Link>
          </div>
        </div>
      </div>

      {/* Cards Promocionais */}
      {!loading && promoCards.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">
            Destaques
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promoCards.map((card) => {
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
                  {card.imageUrl && (
                    <div className="relative overflow-hidden">
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className="w-full h-56 object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                    <p className="text-sm mb-4 line-clamp-3">{card.content}</p>
                    {cardLink && (
                      <div className="flex items-center text-sm font-semibold text-gray-900">
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

      {/* Percurso do Bloco */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white border border-[#dee2e6] rounded-3xl p-6 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
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
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="bg-[#f8f9fa] border border-[#dee2e6] rounded-3xl p-6 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Não perca essa oportunidade!
          </h2>
          <p className="text-base sm:text-lg text-gray-700 mb-6">
            Garanta seu Abadá do Bloco Vou Ali e faça parte dessa festa incrível
          </p>
          <Link
            href="/comprar"
            className="inline-block px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-bold text-lg shadow transition-all"
          >
            Comprar Meu Abadá Agora
          </Link>
        </div>
      </div>
    </div>
  )
}
