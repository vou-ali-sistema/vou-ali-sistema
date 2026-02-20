import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Usuário TROCAS pode acessar: trocas (ler QR) e lista de convidados (confirmar quem já entrou)
const TROCAS_ALLOWED_PATHS = ['/admin/trocas', '/admin/lista-convidados']

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname
    if (path === '/admin/login') return NextResponse.next()

    const role = (req.nextauth?.token?.role as string) || ''
    if (role === 'TROCAS') {
      if (path === '/admin' || path === '/admin/') {
        return NextResponse.redirect(new URL('/admin/trocas', req.url))
      }
      const allowed = TROCAS_ALLOWED_PATHS.some((p) => path === p || path.startsWith(p + '/'))
      if (!allowed) {
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
