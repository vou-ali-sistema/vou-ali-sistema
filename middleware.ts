import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Se for a rota de login, sempre permitir
    if (req.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acesso a /admin/login sem autenticação
        if (req.nextUrl.pathname === '/admin/login') {
          return true
        }
        // Todas as outras rotas /admin requerem autenticação
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
