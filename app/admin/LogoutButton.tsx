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
      className="text-sm text-white hover:text-yellow-300 px-3 py-1 border-2 border-white hover:border-yellow-300 rounded-lg hover:bg-white/10 transition-colors font-medium"
    >
      Sair
    </button>
  )
}

