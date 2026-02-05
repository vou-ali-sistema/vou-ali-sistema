'use client'

import { useEffect } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'

export default function FilterStatus() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const status = searchParams.get('status') || ''

  useEffect(() => {
    // Log para debug
    console.log('[FilterStatus] Status da URL:', status)
    console.log('[FilterStatus] Pathname:', pathname)
    console.log('[FilterStatus] Todos os params:', Object.fromEntries(searchParams.entries()))
  }, [status, pathname, searchParams])

  return null
}
