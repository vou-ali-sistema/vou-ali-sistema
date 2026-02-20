'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="min-h-[44px] min-w-[44px] sm:min-w-0 flex items-center justify-center text-sm sm:text-base text-white active:text-yellow-300 px-4 py-2.5 border-2 border-white active:border-yellow-300 rounded-lg active:bg-white/10 transition-colors font-medium touch-manipulation"
    >
      Sair
    </button>
  )
}

