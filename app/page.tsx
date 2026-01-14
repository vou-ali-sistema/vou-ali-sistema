'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from './components/Logo'

interface PromoCard {
  id: string
  title: string
  content: string
  imageUrl: string | null
  backgroundColor: string | null
  textColor: string | null
  linkEnabled: boolean
  linkUrl: string | null
}

export default function HomePage() {
  const [promoCards, setPromoCards] = useState<PromoCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    
    async function fetchCards() {
      try {
        const res = await fetch('/api/promo-cards')
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-block mb-6">
              <Logo size="large" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
              Esse é o último!
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 mb-8">
              Garanta seu Abadá do Bloco Vou Ali
            </p>
            <Link
              href="/comprar"
              className="inline-block px-8 py-4 bg-yellow-400 text-blue-900 rounded-xl hover:bg-yellow-300 font-bold text-lg shadow-2xl transition-all transform hover:scale-105"
            >
              🎉 Comprar Agora
            </Link>
          </div>
        </div>
      </div>

      {/* Cards Promocionais */}
      {!loading && promoCards.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promoCards.map((card) => {
              const cardLink = card.linkEnabled 
                ? (card.linkUrl || '/comprar')
                : null
              
              const CardContent = (
                <div
                  className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden transition-all transform hover:scale-105 hover:shadow-2xl"
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
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                    <p className="text-sm mb-4 line-clamp-3">{card.content}</p>
                    {cardLink && (
                      <div className="flex items-center text-sm font-semibold text-green-600 group-hover:text-green-700">
                        <span>Comprar Abadá</span>
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

      {/* Call to Action Final */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 sm:p-12 text-center border-2 border-white/20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Não perca essa oportunidade!
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Garanta seu Abadá do Bloco Vou Ali e faça parte dessa festa incrível
          </p>
          <Link
            href="/comprar"
            className="inline-block px-10 py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 rounded-xl hover:from-yellow-300 hover:to-yellow-400 font-bold text-xl shadow-2xl transition-all transform hover:scale-105"
          >
            🛒 Comprar Meu Abadá Agora
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-900/50 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/80 text-sm">
            Bloco Vou Ali - Ano XI | Desde 2016
          </p>
          <p className="text-white/60 text-xs mt-2">
            Esse é o último!
          </p>
        </div>
      </footer>
    </div>
  )
}
