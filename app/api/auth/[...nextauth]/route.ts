import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth depende de headers (host/proto) e não deve ser pré-renderizado.
export const dynamic = 'force-dynamic'

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

async function wrapped(req: Request) {
  normalizeNextAuthUrl(req)
  return handler(req)
}

export { wrapped as GET, wrapped as POST }

