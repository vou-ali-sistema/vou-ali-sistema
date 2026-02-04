import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { NextRequest } from 'next/server'

// NextAuth depende de headers (host/proto) e não deve ser pré-renderizado.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

function normalizeNextAuthUrl(req: Request) {
  // Em produção (Vercel), o domínio pode variar entre www e sem-www.
  // Em localhost, usar http para que cookies/sessão funcionem.
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  let proto = req.headers.get('x-forwarded-proto') || ''
  if (!proto && host && /localhost|127\.0\.0\.1/.test(host)) {
    proto = 'http'
  }
  if (!proto) proto = 'https'

  if (host) {
    const desired = `${proto}://${host}`
    process.env.NEXTAUTH_URL = desired
  }
}

type Next16RouteCtx = { params: Promise<{ nextauth: string[] }> }

export async function GET(req: NextRequest, ctx: Next16RouteCtx) {
  normalizeNextAuthUrl(req)
  try {
    const params = await ctx.params
    return await handler(req, { params } as any)
  } catch (err) {
    console.error('NextAuth fatal error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: 'NextAuthError', message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}

export async function POST(req: NextRequest, ctx: Next16RouteCtx) {
  normalizeNextAuthUrl(req)
  try {
    const params = await ctx.params
    return await handler(req, { params } as any)
  } catch (err) {
    console.error('NextAuth fatal error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: 'NextAuthError', message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}

