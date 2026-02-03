'use client'

import { useState, useEffect } from 'react'

// Data do desfile Vou Ali 2026 (sábado de Carnaval - ajuste se necessário)
const DESFILE_DATE = new Date('2026-02-21T14:00:00')

function pad(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0')
}

export default function Countdown() {
  const [mounted, setMounted] = useState(false)
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)

  useEffect(() => {
    setMounted(true)
    const tick = () => {
      const now = new Date()
      const diff = DESFILE_DATE.getTime() - now.getTime()
      if (diff <= 0) {
        setDays(0)
        setHours(0)
        setMinutes(0)
        return
      }
      const d = diff / (1000 * 60 * 60 * 24)
      const h = (d % 1) * 24
      const m = (h % 1) * 60
      setDays(d)
      setHours(h)
      setMinutes(m)
    }
    tick()
    const id = setInterval(tick, 60 * 1000) // atualiza a cada minuto
    return () => clearInterval(id)
  }, [])

  if (!mounted) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <span className="text-sm sm:text-base font-bold text-white/80">Carregando...</span>
      </div>
    )
  }

  const blocks = [
    { value: days, label: 'Dias', key: 'd' },
    { value: hours, label: 'Horas', key: 'h' },
    { value: minutes, label: 'Min', key: 'm' },
  ]

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm animate-countdown-motion">
      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white/90 mr-1">
        Desfile 2026
      </span>
      {blocks.map(({ value, label, key }) => (
        <div key={key} className="flex flex-col items-center">
          <span
            key={`${key}-${pad(value)}`}
            className="tabular-nums text-2xl sm:text-3xl font-black text-white min-w-[2.5rem] sm:min-w-[3rem] text-center animate-countdown-pulse"
          >
            {pad(value)}
          </span>
          <span className="text-[10px] sm:text-xs font-bold text-white/70 uppercase tracking-wider">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
