import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    const where: any = {}
    if (from || to) {
      where.occurredAt = {}
      if (from) where.occurredAt.gte = new Date(from)
      if (to) where.occurredAt.lte = new Date(to)
    }

    const [incomeAgg, expenseAgg, byCategory] = await Promise.all([
      prisma.financeEntry.aggregate({
        where: { ...where, type: 'INCOME' as any },
        _sum: { amountCents: true },
      }),
      prisma.financeEntry.aggregate({
        where: { ...where, type: 'EXPENSE' as any },
        _sum: { amountCents: true },
      }),
      prisma.financeEntry.groupBy({
        by: ['type', 'category'],
        where,
        _sum: { amountCents: true },
      }),
    ])

    const incomeCents = incomeAgg._sum.amountCents || 0
    const expenseCents = expenseAgg._sum.amountCents || 0

    const categoryTotals: Record<string, number> = {}
    for (const row of byCategory) {
      const key = `${row.type}:${row.category}`
      categoryTotals[key] = row._sum.amountCents || 0
    }

    return NextResponse.json({
      incomeCents,
      expenseCents,
      netCents: incomeCents - expenseCents,
      categoryTotals,
    })
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resumo financeiro' },
      { status: 500 }
    )
  }
}

