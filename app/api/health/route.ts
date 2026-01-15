import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function safeCheck<T>(label: string, fn: () => Promise<T>) {
  try {
    const value = await fn()
    return { label, ok: true as const, value }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { label, ok: false as const, error: message }
  }
}

export async function GET() {
  const env = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
    APP_BASE_URL: process.env.APP_BASE_URL || null,
    hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    hasDATABASE_URL: !!process.env.DATABASE_URL,
  }

  const checks = await Promise.all([
    safeCheck('db:connect', async () => {
      // Conectividade básica (independente de tabela)
      await prisma.$queryRaw`SELECT 1`
      return true
    }),
    safeCheck('db:table:user', async () => prisma.user.count()),
    safeCheck('db:table:lot', async () => prisma.lot.count()),
    safeCheck('db:table:promoCard', async () => prisma.promoCard.count()),
  ])

  const ok = checks.every((c) => c.ok)

  return NextResponse.json(
    {
      ok,
      env,
      checks,
      hint:
        ok
          ? 'OK'
          : 'Se estiver na Vercel: confira DATABASE_URL/NEXTAUTH_SECRET e se o Build Command está rodando prisma db push (vercel-build).',
    },
    { status: ok ? 200 : 500 }
  )
}

