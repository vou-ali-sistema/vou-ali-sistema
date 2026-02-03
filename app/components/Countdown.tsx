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
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    setMounted(true)
    const tick = () => {
      const now = new Date()
      const diff = DESFILE_DATE.getTime() - now.getTime()
      if (diff <= 0) {
        setDays(0)
        setHours(0)
        setMinutes(0)
        setSeconds(0)
        return
      }
      const totalSeconds = Math.floor(diff / 1000)
      const d = Math.floor(totalSeconds / (24 * 60 * 60))
      const h = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
      const m = Math.floor((totalSeconds % (60 * 60)) / 60)
      const s = totalSeconds % 60
      setDays(d)
      setHours(h)
      setMinutes(m)
      setSeconds(s)
    }
    tick()
    const id = setInterval(tick, 1000) // atualiza a cada segundo
    return () => clearInterval(id)
  }, [])

  if (!mounted) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <span className="text-sm text-white/70">Carregando...</span>
      </div>
    )
  }

  const blocks = [
    { value: days, label: 'Dias', key: 'd' },
    { value: hours, label: 'Horas', key: 'h' },
    { value: minutes, label: 'Min', key: 'm' },
    { value: seconds, label: 'Seg', key: 's' },
  ]

  return (
    <div className="flex flex-col items-center gap-3 py-4 px-5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm animate-countdown-motion">
      <p className="text-xs sm:text-sm font-semibold text-white/70 tracking-wide text-center">
        Contagem para o grande dia
      </p>
      <p className="text-[10px] sm:text-xs text-white/50 -mt-1 text-center">
        Vou Ali · Carnaval 2026
      </p>
      <div className="flex flex-wrap items-stretch justify-center gap-2 sm:gap-3">
        {blocks.map(({ value, label, key }) => (
          <div
            key={key}
            className="flex flex-col items-center min-w-[3.5rem] sm:min-w-[4rem] rounded-xl bg-white/[0.08] border border-white/10 px-2 py-2 sm:px-3 sm:py-2.5"
          >
            <span
              key={`${key}-${pad(value)}`}
              className="tabular-nums text-2xl sm:text-3xl font-black text-white text-center block animate-countdown-pulse"
            >
              {pad(value)}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-white/60 uppercase tracking-wider mt-1">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
