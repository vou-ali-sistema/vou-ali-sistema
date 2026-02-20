import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const TROCAS_ONLY_PATHS = '/admin/trocas'

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname
    if (path === '/admin/login') return NextResponse.next()

    const role = (req.nextauth?.token?.role as string) || ''
    // Usuário TROCAS só pode acessar a página de trocas (ler QR)
    if (role === 'TROCAS') {
      if (path === '/admin' || path === '/admin/') {
        return NextResponse.redirect(new URL('/admin/trocas', req.url))
      }
      if (!path.startsWith(TROCAS_ONLY_PATHS)) {
        return NextResponse.redirect(new URL('/admin/trocas', req.url))
      }
    }
    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/admin/login',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === '/admin/login') return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
