import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const atualizarLotSchema = z.object({
  name: z.string().min(1).optional(),
  abadaPriceCents: z.number().int().positive().optional(),
  pulseiraPriceCents: z.number().int().positive().optional(),
  startsAt: z.union([z.string().datetime(), z.null(), z.undefined()]).optional(),
  endsAt: z.union([z.string().datetime(), z.null(), z.undefined()]).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = atualizarLotSchema.parse(body)

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.abadaPriceCents !== undefined) updateData.abadaPriceCents = data.abadaPriceCents
    if (data.pulseiraPriceCents !== undefined) updateData.pulseiraPriceCents = data.pulseiraPriceCents
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null
    if (data.endsAt !== undefined) updateData.endsAt = data.endsAt ? new Date(data.endsAt) : null

    const lot = await prisma.lot.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(lot)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Erro de validação:', error.errors)
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao atualizar lote:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Erro ao atualizar lote', details: errorMessage },
      { status: 500 }
    )
  }
}

