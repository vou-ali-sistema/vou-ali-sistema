'use client'

import { useEffect, useMemo, useState } from 'react'

export type PromoCardMedia = {
  id?: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  displayOrder?: number
}

function normalizeMedia(media: PromoCardMedia[]) {
  return (media || [])
    .filter((m) => !!m?.mediaUrl)
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
}

export default function PromoMediaCarousel({
  media,
  autoPlay,
  intervalMs,
  altBase,
  className,
  onIndexChange,
}: {
  media: PromoCardMedia[]
  autoPlay?: boolean
  intervalMs?: number
  altBase?: string
  className?: string
  onIndexChange?: (index: number) => void
}) {
  const items = useMemo(() => normalizeMedia(media), [media])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [items.length])

  useEffect(() => {
    if (!autoPlay) return
    if (items.length <= 1) return
    const ms = Math.max(1000, intervalMs ?? 5000)
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, ms)
    return () => clearInterval(t)
  }, [autoPlay, intervalMs, items.length])

  useEffect(() => {
    onIndexChange?.(index)
  }, [index, onIndexChange])

  if (!items.length) return null
  const active = items[Math.min(index, items.length - 1)]

  return (
    <div className={className}>
      <div className="relative w-full overflow-hidden rounded-xl border border-[#dee2e6] bg-white">
        <div className="aspect-[16/9] w-full bg-[#f8f9fa]">
          {active.mediaType === 'video' ? (
            <video
              src={active.mediaUrl}
              className="h-full w-full object-contain"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={active.mediaUrl}
              alt={altBase ? `${altBase} (${index + 1}/${items.length})` : 'Mídia'}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          )}
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-[#dee2e6] bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-white"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[#dee2e6] bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-white"
              aria-label="Próximo"
            >
              ›
            </button>

            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full border border-[#dee2e6] ${
                    i === index ? 'bg-gray-900' : 'bg-white'
                  }`}
                  aria-label={`Ir para mídia ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

