'use client'

export default function ConfettiStreamers() {
  const colors = [
    '#facc15', '#fbbf24', '#f59e0b', // amarelo/âmbar
    '#ec4899', '#f472b6', '#fb7185', // rosa
    '#22c55e', '#34d399', // verde
    '#38bdf8', '#60a5fa', // azul
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden>
      {/* Bordas: confetes e serpentinas */}
      {/* Topo */}
      <div className="absolute top-0 left-0 right-0 h-2 sm:h-3 flex gap-0.5 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={`t-${i}`}
            className="flex-1 min-w-[4px] rounded-b opacity-60"
            style={{
              height: i % 3 === 0 ? '100%' : i % 3 === 1 ? '70%' : '85%',
              backgroundColor: colors[i % colors.length],
              transform: `translateX(${i % 2 === 0 ? 0 : 4}px)`,
            }}
          />
        ))}
      </div>
      {/* Esquerda - faixa colorida */}
      <div
        className="absolute top-0 left-0 bottom-0 w-2 sm:w-3 opacity-60 rounded-r"
        style={{
          background: `repeating-linear-gradient(180deg, ${colors[0]} 0px, ${colors[0]} 4px, ${colors[1]} 4px, ${colors[1]} 8px, ${colors[2]} 8px, ${colors[2]} 12px, ${colors[3]} 12px, ${colors[3]} 16px)`,
        }}
      />
      {/* Direita - faixa colorida */}
      <div
        className="absolute top-0 right-0 bottom-0 w-2 sm:w-3 opacity-60 rounded-l"
        style={{
          background: `repeating-linear-gradient(180deg, ${colors[4]} 0px, ${colors[4]} 4px, ${colors[5]} 4px, ${colors[5]} 8px, ${colors[6]} 8px, ${colors[6]} 12px, ${colors[7]} 12px, ${colors[7]} 16px)`,
        }}
      />
      {/* Base */}
      <div className="absolute bottom-0 left-0 right-0 h-2 sm:h-3 flex gap-0.5 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={`b-${i}`}
            className="flex-1 min-w-[4px] rounded-t opacity-60"
            style={{
              height: i % 3 === 1 ? '100%' : i % 3 === 0 ? '70%' : '85%',
              backgroundColor: colors[(i + 3) % colors.length],
            }}
          />
        ))}
      </div>
      {/* Serpentinas diagonais decorativas (cantos) */}
      <div className="absolute top-0 left-8 w-16 h-1 rotate-[-25deg] rounded-full bg-gradient-to-r from-amber-400/40 to-pink-400/40 opacity-70" />
      <div className="absolute top-0 right-8 w-16 h-1 rotate-[25deg] rounded-full bg-gradient-to-l from-amber-400/40 to-pink-400/40 opacity-70" />
      <div className="absolute bottom-0 left-8 w-16 h-1 rotate-[25deg] rounded-full bg-gradient-to-r from-pink-400/40 to-amber-400/40 opacity-70" />
      <div className="absolute bottom-0 right-8 w-16 h-1 rotate-[-25deg] rounded-full bg-gradient-to-l from-pink-400/40 to-amber-400/40 opacity-70" />
    </div>
  )
}
