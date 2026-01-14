'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const router = useRouter()

  // Se for a página de login, não aplicar o layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Se não tiver sessão e não for login, redirecionar
  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [status, pathname, router])

  // Se ainda está carregando ou não tem sessão, mostrar loading
  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-green-600 to-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-white">
                  <span className="text-yellow-300">BLOCO</span> VOU ALI - Admin
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/admin"
                  className="border-transparent text-white hover:text-yellow-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-yellow-300 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/pedidos"
                  className="border-transparent text-white hover:text-yellow-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-yellow-300 text-sm font-medium transition-colors"
                >
                  Pedidos
                </Link>
                <Link
                  href="/admin/trocas"
                  className="border-transparent text-white hover:text-yellow-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-yellow-300 text-sm font-medium transition-colors"
                >
                  Trocas
                </Link>
                <Link
                  href="/admin/cortesias"
                  className="border-transparent text-white hover:text-yellow-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-yellow-300 text-sm font-medium transition-colors"
                >
                  Cortesias
                </Link>
                <Link
                  href="/admin/lotes"
                  className="border-transparent text-white hover:text-yellow-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-yellow-300 text-sm font-medium transition-colors"
                >
                  Lotes
                </Link>
                <Link
                  href="/admin/promo-cards"
                  className="border-transparent text-white hover:text-yellow-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-yellow-300 text-sm font-medium transition-colors"
                >
                  Cards
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white">{session.user?.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

