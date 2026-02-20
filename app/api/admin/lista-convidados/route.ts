import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const list = await prisma.convidado.findMany({
      orderBy: { nomeCompleto: 'asc' },
    })
    return NextResponse.json(list)
  } catch (error) {
    console.error('Erro ao listar convidados:', error)
    return NextResponse.json({ error: 'Erro ao listar convidados' }, { status: 500 })
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

    const cpfNormalizado = data.cpf.trim().replace(/\D/g, '')
    if (!cpfNormalizado) {
      return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
    }

    const jaExiste = await prisma.convidado.findUnique({
      where: { cpf: cpfNormalizado },
    })
    if (jaExiste) {
      return NextResponse.json(
        { error: 'Este CPF já está na lista de convidados.' },
        { status: 400 }
      )
    }

    const created = await prisma.convidado.create({
      data: {
        nomeCompleto: data.nomeCompleto.trim(),
        cpf: cpfNormalizado,
        telefone: data.telefone.trim().replace(/\D/g, ''),
      },
    })
    return NextResponse.json(created)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = error.errors.map((e) => e.message).join(', ')
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este CPF já está na lista de convidados.' },
        { status: 400 }
      )
    }
    console.error('Erro ao criar convidado:', error)
    return NextResponse.json({ error: 'Erro ao criar convidado' }, { status: 500 })
  }
}
