import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth depende de headers (host/proto) e não deve ser pré-renderizado.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

function normalizeNextAuthUrl(req: Request) {
  // Em produção (Vercel), o domínio pode variar entre www e sem-www.
  // Se NEXTAUTH_URL não bater com o host atual, o NextAuth pode falhar.
  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || 'https'

  if (host) {
    const current = process.env.NEXTAUTH_URL || ''
    const desired = `${proto}://${host}`
    if (!current || current !== desired) {
      process.env.NEXTAUTH_URL = desired
    }
  }
}

type RouteCtx = { params?: { nextauth?: string[] } }

async function wrapped(req: Request, ctx: RouteCtx) {
  normalizeNextAuthUrl(req)
  try {
    // Importante: repassar o `ctx` com `params.nextauth` para o NextAuth
    return await handler(req, ctx as any)
  } catch (err) {
    // Garantir JSON (evita "Unexpected end of JSON input" no client)
    console.error('NextAuth fatal error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: 'NextAuthError', message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}

export { wrapped as GET, wrapped as POST }

