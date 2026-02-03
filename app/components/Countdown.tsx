'use client'

import { useState, useEffect } from 'react'

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
      setDays(Math.floor(totalSeconds / (24 * 60 * 60)))
      setHours(Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60)))
      setMinutes(Math.floor((totalSeconds % (60 * 60)) / 60))
      setSeconds(totalSeconds % 60)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-5 py-3">
        <span className="text-sm text-white/60">—</span>
      </div>
    )
  }

  const units = [
    { value: days, label: 'd' },
    { value: hours, label: 'h' },
    { value: minutes, label: 'm' },
    { value: seconds, label: 's' },
  ] as const

  return (
    <div className="inline-flex items-center gap-1 sm:gap-2 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm px-4 py-3 sm:px-5 sm:py-3.5 animate-countdown-motion">
      {units.map(({ value, label }, i) => (
        <span key={label} className="inline-flex items-baseline gap-0.5 sm:gap-1">
          {i > 0 && (
            <span className="tabular-nums text-lg sm:text-xl font-light text-white/40 select-none" aria-hidden>
              :
            </span>
          )}
          <span className="flex flex-col items-center">
            <span
              key={`${label}-${pad(value)}`}
              className="tabular-nums text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight animate-countdown-pulse"
            >
              {pad(value)}
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium text-white/50 uppercase tracking-widest mt-0.5">
              {label}
            </span>
          </span>
        </span>
      ))}
    </div>
  )
}
