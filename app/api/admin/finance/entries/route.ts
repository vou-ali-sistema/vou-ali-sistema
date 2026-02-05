import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.enum(['PATROCINIO', 'PAGAMENTO', 'OUTROS']).default('OUTROS'),
  amountCents: z.number().int().min(1),
  description: z.string().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  occurredAt: z.string().optional().or(z.literal('')).transform((v) => (v ? new Date(v) : undefined)),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const take = Math.min(200, Math.max(1, Number(url.searchParams.get('take') ?? 50) || 50))

    const entries = await prisma.financeEntry.findMany({
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      take,
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Erro ao listar lançamentos:', error)
    return NextResponse.json({ error: 'Erro ao listar lançamentos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    const created = await prisma.financeEntry.create({
      data: {
        type: data.type as any,
        category: data.category as any,
        amountCents: data.amountCents,
        description: data.description ?? null,
        occurredAt: (data.occurredAt as any) ?? undefined,
      } as any,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Erro ao criar lançamento:', error)
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 })
  }
}

