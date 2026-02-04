'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isLoginPage = pathname === '/admin/login'

  const navItems = useMemo(
    () => [
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/pedidos', label: 'Pedidos' },
      { href: '/admin/trocas', label: 'Trocas' },
      { href: '/admin/cortesias', label: 'Cortesias' },
      { href: '/admin/lotes', label: 'Lotes' },
      { href: '/admin/promo-cards', label: 'Cards' },
    ],
    []
  )

  // Se não tiver sessão e não for login, redirecionar
  useEffect(() => {
    if (isLoginPage) return
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, isLoginPage, router])

  // Fechar menu mobile ao trocar de rota
  useEffect(() => {
    if (isLoginPage) return
    setMobileMenuOpen(false)
  }, [pathname, isLoginPage])

  // Se for a página de login, não aplicar o layout (mas sem pular hooks)
  if (isLoginPage) {
    return <>{children}</>
  }

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
            <div className="flex items-center gap-3">
              {/* Botão menu (mobile) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="sm:hidden inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white hover:bg-white/15"
                aria-label="Abrir menu"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-base sm:text-xl font-bold text-white leading-tight">
                  <span className="text-yellow-300">BLOCO</span> VOU ALI - Admin
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
                        active
                          ? 'text-yellow-300 border-yellow-300'
                          : 'text-white border-transparent hover:text-yellow-300 hover:border-yellow-300',
                      ].join(' ')}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-sm text-white truncate max-w-[240px]">
                {session.user?.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Menu Mobile (overlay) */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Menu
                <div className="text-xs font-normal text-gray-600 mt-1 break-all">
                  {session.user?.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900"
                aria-label="Fechar menu"
              >
                ✕
              </button>
            </div>

            <div className="p-2">
              {navItems.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'block rounded-lg px-4 py-3 text-sm font-semibold',
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-900 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <div className="p-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

