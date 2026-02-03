'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/app/components/Logo'
import PromoMediaCarousel, { PromoCardMedia } from '@/app/components/PromoMediaCarousel'
import Countdown from '@/app/components/Countdown'
import Seal11Anos from '@/app/components/Seal11Anos'

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

// Cards fixos de apoios: coloque as imagens em public/apoios/ e liste aqui (imageUrl, title, linkUrl opcional)
const APOIOS: { imageUrl: string; title: string; linkUrl?: string }[] = [
  { imageUrl: '/apoios/placeholder.svg', title: 'Apoiador 1' },
  { imageUrl: '/apoios/placeholder.svg', title: 'Apoiador 2' },
  { imageUrl: '/apoios/placeholder.svg', title: 'Apoiador 3' },
  { imageUrl: '/apoios/placeholder.svg', title: 'Apoiador 4' },
  // Troque pelos seus logos: { imageUrl: '/apoios/logo.png', title: 'Nome', linkUrl: 'https://...' },
]

export default function HomePage() {
  const [promoCards, setPromoCards] = useState<PromoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [galleryIndex, setGalleryIndex] = useState(0)

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
  const abadaCard = promoCards.find((c) => {
    const t = (c.title || '').toLowerCase()
    return t.includes('abad') || t.includes('camisa') || t.includes('uniforme')
  })
  const galeriaCard = promoCards.find((c) => {
    const t = (c.title || '').toLowerCase()
    return t.includes('galeria') || t.includes('fotos') || t.includes('outros anos') || t.includes('anos anteriores')
  })
  // Destaques: excluir cards "especiais" que já têm lugar próprio na página (percurso e galeria)
  const highlightCardsBase = promoCards.filter((c) => {
    if (percursoCard && c.id === percursoCard.id) return false
    if (galeriaCard && c.id === galeriaCard.id) return false
    return true
  })
  const highlightCards = highlightCardsBase

  const galleryMedia: PromoCardMedia[] = (Array.isArray(galeriaCard?.media) && galeriaCard!.media!.length > 0
    ? galeriaCard!.media!
    : highlightCards.flatMap((c) => (Array.isArray(c.media) ? c.media : []))
  ).filter((m) => m.mediaType === 'image')

  // Link da galeria:
  // - Se houver um card "galeria", respeitar linkEnabled/linkUrl dele.
  // - Se não houver, manter comportamento antigo (clicar leva ao /comprar).
  const galleryLink = galeriaCard
    ? (galeriaCard.linkEnabled ? (galeriaCard.linkUrl || '/comprar') : null)
    : '/comprar'

  const glassBorderBg =
    'linear-gradient(90deg, rgba(34,197,94,0.55), rgba(56,189,248,0.35), rgba(59,130,246,0.50))'

  const galleryThumbs = (() => {
    const list = galleryMedia || []
    if (list.length <= 8) return list
    const start = ((galleryIndex % list.length) + list.length) % list.length
    return Array.from({ length: 8 }, (_, i) => list[(start + i) % list.length])
  })()

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030817] text-[#EAF2FF]">
      {/* Fundo Premium Brazil-Core High-Tech (Copa 2026) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(34,197,94,0.22),transparent_40%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_55%_92%,rgba(250,204,21,0.14),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.20] bg-[linear-gradient(135deg,transparent_0%,transparent_34%,rgba(34,197,94,0.35)_34%,rgba(34,197,94,0.35)_45%,rgba(250,204,21,0.26)_45%,rgba(250,204,21,0.26)_55%,rgba(56,189,248,0.28)_55%,rgba(56,189,248,0.28)_70%,transparent_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,23,0.80)_0%,rgba(3,8,23,0.40)_35%,rgba(3,8,23,0.88)_100%)]" />
      </div>

      {/* Linha superior Brasil (detalhe) */}
      <div className="relative h-1.5 w-full bg-[linear-gradient(90deg,#22c55e_0%,#22c55e_30%,#facc15_30%,#facc15_62%,#38bdf8_62%,#3b82f6_100%)]" />

      {/* Countdown para o desfile 2026 */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Countdown />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Hero Section */}
        <div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-[12px]"
          style={{
            border: '1px solid transparent',
            background:
              'linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.08)) padding-box, ' +
              `${glassBorderBg} border-box`,
          }}
        >
          <Seal11Anos />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm sm:text-base font-bold text-amber-200/90 mb-3 tracking-wide">
                Vou Ali 2026 – 11 anos de história
              </p>
              <div className="inline-flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-[#EAF2FF] border border-emerald-400/35 backdrop-blur-[12px]">
                  Brasil
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-yellow-400/20 text-[#EAF2FF] border border-yellow-300/30 backdrop-blur-[12px]">
                  Ano XI
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-400/15 text-[#EAF2FF] border border-sky-300/30 backdrop-blur-[12px]">
                  Desde 2016
                </span>
                <a
                  href="https://www.instagram.com/vouali_bloco/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-white/10 text-[#EAF2FF] border border-white/15 backdrop-blur-[12px] hover:bg-white/14 transition-colors"
                  aria-label="Abrir Instagram do Bloco Vou Ali"
                  title="Instagram @vouali_bloco"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm10.2 1.8a1 1 0 1 1 0 2a1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10a5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6a3 3 0 0 0 0-6Z" />
                  </svg>
                  <span>@vouali_bloco</span>
                </a>
              </div>

              <div className="mb-4">
                <Logo size="large" />
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#F4FAFF] mb-3">
                Esse é o último!
              </h1>
              <p className="text-base sm:text-lg text-white/80 mb-6 max-w-xl">
                Ano de Copa, clima de Brasil: garanta seu <span className="font-semibold text-[#F4FAFF]">Abadá</span> e venha com a gente nessa festa.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/comprar"
                  className="relative inline-flex items-center justify-center px-8 py-4 rounded-xl font-black text-lg tracking-wide text-[#061019] shadow-[0_16px_45px_rgba(34,197,94,0.25)] transition-all border border-emerald-300/30 overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(34,197,94,1) 0%, rgba(250,204,21,1) 55%, rgba(56,189,248,1) 100%)',
                  }}
                >
                  <span className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),transparent_55%)]" />
                  <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-[linear-gradient(90deg,rgba(255,255,255,0.15),transparent,rgba(255,255,255,0.15))]" />
                  <span className="relative">Comprar Agora</span>
                </Link>
                <a
                  href="#percurso"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-black text-lg tracking-wide text-[#EAF2FF] shadow-[0_16px_45px_rgba(56,189,248,0.18)] border border-sky-300/25 bg-white/10 backdrop-blur-[12px] hover:bg-white/14 transition-colors"
                >
                  Ver Percurso
                </a>
              </div>
            </div>

            <div className="lg:justify-self-end w-full">
              {abadaCard && (Array.isArray(abadaCard.media) && abadaCard.media.length > 0) ? (
                <PromoMediaCarousel
                  media={abadaCard.media}
                  autoPlay={true}
                  intervalMs={abadaCard.slideInterval ?? 5000}
                  altBase={abadaCard.title || 'Abadá'}
                  className="shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                  frameClassName="w-full min-h-[220px] bg-[#f8f9fa] flex items-center justify-center p-2 rounded-xl"
                  mediaClassName="w-full h-auto max-h-[420px] !object-contain"
                />
              ) : abadaCard?.imageUrl ? (
                <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                  <div className="aspect-[16/9] bg-white/5 flex items-center justify-center p-2">
                    <img
                      src={abadaCard.imageUrl}
                      alt={abadaCard.title || 'Abadá'}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-[12px] p-6 text-sm text-white/75">
                  <p className="font-semibold text-[#F4FAFF] mb-2">Coloque a imagem do abadá aqui</p>
                  <p>
                    No admin, crie um card com título contendo <span className="font-mono">Abadá</span> e envie a foto como mídia.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards Promocionais */}
      {!loading && highlightCards.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <h2 className="text-xl sm:text-2xl font-black text-[#F4FAFF] mb-1 tracking-tight">
            Destaques
          </h2>
          <p className="text-sm text-white/60 mb-6">Vou Ali 2026 – 11 anos de história</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 auto-rows-fr items-stretch">
            {highlightCards.map((card) => {
              const cardLink = card.linkEnabled 
                ? (card.linkUrl || '/comprar')
                : null
              
              const CardContent = (
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col bg-white/[0.06] border border-white/10 backdrop-blur-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:bg-white/[0.08] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] hover:border-white/20"
                  style={{
                    color: card.textColor || '#EAF2FF',
                    cursor: cardLink ? 'pointer' : 'default',
                  }}
                >
                  {(Array.isArray(card.media) && card.media.length > 0) || card.imageUrl ? (
                    <div className="p-4 pb-0">
                      {Array.isArray(card.media) && card.media.length > 0 ? (
                        <PromoMediaCarousel
                          media={card.media}
                          autoPlay={card.autoPlay ?? true}
                          intervalMs={card.slideInterval ?? 5000}
                          altBase={card.title}
                          frameClassName="w-full min-h-[200px] bg-white/[0.04] flex items-center justify-center p-3 rounded-xl border border-white/5"
                          mediaClassName="w-full h-auto max-h-[280px] !object-contain"
                        />
                      ) : (
                        <div className="relative w-full overflow-hidden rounded-xl border border-white/5 bg-white/[0.04]">
                          <div className="aspect-[16/9] w-full flex items-center justify-center p-3">
                            <img
                              src={card.imageUrl as string}
                              alt={card.title}
                              className="h-full w-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="p-5 sm:p-6 flex flex-col flex-1 border-t border-white/5">
                    <h3 className="text-lg sm:text-xl font-black mb-2 line-clamp-2 tracking-tight text-[#F4FAFF]">{card.title}</h3>
                    <p className="text-sm mb-4 line-clamp-4 text-white/70 leading-relaxed">{card.content}</p>
                    {cardLink && (
                      <div className="mt-auto flex items-center text-sm font-semibold text-emerald-400/90 group-hover:text-emerald-300 transition-colors">
                        <span>Ver / Comprar</span>
                        <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="block group h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030817] rounded-2xl"
                  >
                    {CardContent}
                  </Link>
                )
              }

              return (
                <div key={card.id} className="block group h-full">
                  {CardContent}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Galeria (a partir das mídias dos cards HOME) */}
      {!loading && galleryMedia.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <h2 className="text-xl sm:text-2xl font-black text-[#F4FAFF] mb-6 tracking-tight">
            Galeria do Evento
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card com carrossel automático */}
            {galleryLink ? (
              <Link
                href={galleryLink}
                className="lg:col-span-2 block rounded-3xl overflow-hidden backdrop-blur-[12px] shadow-[0_30px_80px_rgba(0,0,0,0.55)] hover:shadow-[0_38px_100px_rgba(0,0,0,0.70)] transition-shadow"
                style={{
                  border: '1px solid transparent',
                  background:
                    'linear-gradient(rgba(255,255,255,0.07), rgba(255,255,255,0.07)) padding-box, ' +
                    `${glassBorderBg} border-box`,
                }}
              >
                <div className="p-4 sm:p-6">
                  <PromoMediaCarousel
                    media={galleryMedia}
                    autoPlay={true}
                    intervalMs={galeriaCard?.slideInterval ?? 3500}
                    altBase={galeriaCard?.title || 'Galeria'}
                    frameClassName="w-full bg-[#f8f9fa] flex items-center justify-center p-2"
                    mediaClassName="w-full h-auto max-h-[520px] !object-contain"
                    onIndexChange={setGalleryIndex}
                  />
                </div>
                <div className="px-6 pb-6">
                  <h3 className="text-xl sm:text-2xl font-black text-[#F4FAFF] tracking-tight">
                    Momentos de outros anos
                  </h3>
                  <p className="text-sm sm:text-base text-white/80 mt-2">
                    Uma prévia do clima do Bloco. Clique para garantir seu abadá.
                  </p>
                </div>
              </Link>
            ) : (
              <div
                className="lg:col-span-2 rounded-3xl overflow-hidden backdrop-blur-[12px] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
                style={{
                  border: '1px solid transparent',
                  background:
                    'linear-gradient(rgba(255,255,255,0.07), rgba(255,255,255,0.07)) padding-box, ' +
                    `${glassBorderBg} border-box`,
                }}
              >
                <div className="p-4 sm:p-6">
                  <PromoMediaCarousel
                    media={galleryMedia}
                    autoPlay={true}
                    intervalMs={galeriaCard?.slideInterval ?? 3500}
                    altBase={galeriaCard?.title || 'Galeria'}
                    frameClassName="w-full bg-[#f8f9fa] flex items-center justify-center p-2"
                    mediaClassName="w-full h-auto max-h-[520px] !object-contain"
                    onIndexChange={setGalleryIndex}
                  />
                </div>
                <div className="px-6 pb-6">
                  <h3 className="text-xl sm:text-2xl font-black text-[#F4FAFF] tracking-tight">
                    Momentos de outros anos
                  </h3>
                  <p className="text-sm sm:text-base text-white/80 mt-2">
                    Uma prévia do clima do Bloco.
                  </p>
                </div>
              </div>
            )}

            {/* Miniaturas */}
            <div className="grid grid-cols-2 gap-4">
              {galleryThumbs.map((m, idx) => (
                galleryLink ? (
                  <Link
                    key={`${m.mediaUrl}-${idx}`}
                    href={galleryLink}
                    className={[
                      'block rounded-2xl overflow-hidden bg-white/5 backdrop-blur-[12px] hover:shadow-[0_14px_40px_rgba(0,0,0,0.45)] transition-shadow',
                      idx === 0 ? 'border border-emerald-300/35 shadow-[0_0_0_1px_rgba(34,197,94,0.18)]' : 'border border-white/10',
                    ].join(' ')}
                  >
                    <div className="aspect-square bg-white/5 p-2">
                      <img
                        src={m.mediaUrl}
                        alt="Galeria"
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  </Link>
                ) : (
                  <div
                    key={`${m.mediaUrl}-${idx}`}
                    className={[
                      'block rounded-2xl overflow-hidden bg-white/5 backdrop-blur-[12px]',
                      idx === 0 ? 'border border-emerald-300/35 shadow-[0_0_0_1px_rgba(34,197,94,0.18)]' : 'border border-white/10',
                    ].join(' ')}
                  >
                    <div className="aspect-square bg-white/5 p-2">
                      <img
                        src={m.mediaUrl}
                        alt="Galeria"
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Percurso do Bloco */}
      <div id="percurso" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 scroll-mt-24">
        <div
          className="backdrop-blur-[12px] rounded-3xl p-6 sm:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
          style={{
            border: '1px solid transparent',
            background:
              'linear-gradient(rgba(255,255,255,0.07), rgba(255,255,255,0.07)) padding-box, ' +
              `${glassBorderBg} border-box`,
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#F4FAFF] mb-4 tracking-tight">
                Percurso do bloco
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-black text-white/90 mb-2">Saída</h3>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-white/80">
                    <li>Confraria do Rei</li>
                    <li>Prof. Sandoval Arroxelas</li>
                    <li>José Júlio Sawer</li>
                    <li>Rua Prefeito Abdon Arroxelas</li>
                    <li>R. Manoel Ribeiro da Rocha</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-black text-white/90 mb-2">Chegada</h3>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-white/80">
                    <li>Av. Eng. Paulo Brandão Nogueira</li>
                  </ul>

                  <div className="mt-4">
                    <a
                      className="inline-flex items-center gap-2 text-sm font-black text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
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

              <p className="text-xs text-white/60 mt-5">
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
                  frameClassName="w-full min-h-[200px] bg-[#f8f9fa] flex items-center justify-center p-2 rounded-xl"
                  mediaClassName="w-full h-auto max-h-[380px] !object-contain"
                />
              ) : percursoCard?.imageUrl ? (
                <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                  <div className="aspect-[3/4] bg-white/5">
                    <img
                      src={percursoCard.imageUrl}
                      alt={percursoCard.title}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-[12px] p-6 text-sm text-white/75">
                  <p className="font-semibold text-[#F4FAFF] mb-2">Quer colocar a imagem do percurso aqui?</p>
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
        <div
          className="backdrop-blur-[12px] rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
          style={{
            border: '1px solid transparent',
            background:
              'linear-gradient(rgba(255,255,255,0.07), rgba(255,255,255,0.07)) padding-box, ' +
              `${glassBorderBg} border-box`,
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(34,197,94,0.22),transparent_60%),radial-gradient(circle_at_75%_30%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(circle_at_50%_90%,rgba(250,204,21,0.12),transparent_55%)]" />
          <h2 className="text-2xl sm:text-3xl font-black text-[#F4FAFF] mb-3 tracking-tight">
            Não perca essa oportunidade!
          </h2>
          <p className="text-base sm:text-lg text-white/80 mb-6">
            Garanta seu Abadá do Bloco Vou Ali e faça parte dessa festa incrível
          </p>
          <Link
            href="/comprar"
            className="relative inline-block px-8 py-4 rounded-xl font-black text-lg tracking-wide text-[#061019] shadow-[0_16px_45px_rgba(250,204,21,0.20)] transition-all border border-yellow-300/25 overflow-hidden"
            style={{
              background:
                'linear-gradient(90deg, rgba(250,204,21,1) 0%, rgba(34,197,94,1) 55%, rgba(56,189,248,1) 100%)',
            }}
          >
            <span className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),transparent_55%)]" />
            <span className="relative">Comprar Meu Abadá Agora</span>
          </Link>
        </div>
      </div>

      {/* Apoios – cards fixos pequenos para logos/apoiadores */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <h2 className="text-xl sm:text-2xl font-black text-[#F4FAFF] mb-2 tracking-tight">
          Nossos Apoios
        </h2>
        <p className="text-sm text-white/60 mb-6">Quem apoia o Bloco Vou Ali</p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-[12px] p-6 sm:p-8">
          {APOIOS.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {APOIOS.map((apoio, idx) => {
                const card = (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/[0.06] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 aspect-square max-w-[100px] sm:max-w-[110px] mx-auto"
                  >
                    <div className="w-full h-full flex items-center justify-center p-1.5 min-h-0 flex-1">
                      <img
                        src={apoio.imageUrl}
                        alt={apoio.title}
                        className="max-h-full max-w-full w-auto h-auto object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-white/70 mt-1.5 line-clamp-2 text-center leading-tight">
                      {apoio.title}
                    </span>
                  </div>
                )
                if (apoio.linkUrl) {
                  return (
                    <a
                      key={idx}
                      href={apoio.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030817] rounded-xl"
                    >
                      {card}
                    </a>
                  )
                }
                return <div key={idx}>{card}</div>
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-white/50 py-8">
              Em breve, nossos apoios em destaque aqui.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
