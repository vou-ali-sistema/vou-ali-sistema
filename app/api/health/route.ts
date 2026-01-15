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
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || null,
    VERCEL_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID || null,
  }

  const checks = await Promise.all([
    safeCheck('db:connect', async () => {
      // Conectividade básica (independente de tabela)
      await prisma.$queryRaw`SELECT 1`
      return true
    }),
    safeCheck('db:table:user', async () => prisma.user.count()),
    safeCheck('db:table:lot', async () => prisma.lot.count()),
    safeCheck('db:table:lot_active', async () => prisma.lot.count({ where: { active: true } })),
    safeCheck('db:table:promoCard', async () => prisma.promoCard.count()),
    safeCheck('db:activeLot', async () =>
      prisma.lot.findFirst({
        where: { active: true },
        select: { id: true, name: true, active: true },
      })
    ),
    safeCheck('db:lots_summary', async () =>
      prisma.lot.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, active: true, createdAt: true },
      })
    ),
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

