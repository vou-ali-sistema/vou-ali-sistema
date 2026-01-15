import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const criarLotSchema = z.object({
  name: z.string().min(1),
  abadaPriceCents: z.number().int().positive(),
  pulseiraPriceCents: z.number().int().positive(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const lots = await prisma.lot.findMany({
      orderBy: [
        { active: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(lots)
  } catch (error) {
    console.error('Erro ao listar lotes:', error)
    return NextResponse.json(
      { error: 'Erro ao listar lotes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = criarLotSchema.parse(body)

    const lot = await prisma.lot.create({
      data: {
        name: data.name,
        abadaPriceCents: data.abadaPriceCents,
        pulseiraPriceCents: data.pulseiraPriceCents,
        active: false, // Sempre criar como inativo
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    })

    return NextResponse.json(lot)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao criar lote:', error)
    return NextResponse.json(
      { error: 'Erro ao criar lote' },
      { status: 500 }
    )
  }
}

