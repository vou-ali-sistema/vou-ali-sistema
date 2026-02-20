import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_TROCAS = 'vouali.trocas'
const SENHA_TROCAS = '112233'

/**
 * POST: Garante que o usuário vouali.trocas existe (para login da portaria).
 * Só pode ser chamado por alguém logado como admin.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const role = (session.user as { role?: string })?.role
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas admin pode executar esta ação' }, { status: 403 })
    }

    // Garantir que o enum Role no PostgreSQL tem TROCAS
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TROCAS'`)
    } catch (_) {
      // Ignora se já existir
    }

    const hashTrocas = await bcrypt.hash(SENHA_TROCAS, 10)
    const userTrocas = await prisma.user.findFirst({
      where: { email: { equals: EMAIL_TROCAS, mode: 'insensitive' } },
    })

    if (!userTrocas) {
      await prisma.user.create({
        data: {
          name: 'Trocas (funcionário)',
          email: EMAIL_TROCAS,
          passwordHash: hashTrocas,
          role: Role.TROCAS,
          active: true,
        },
      })
      return NextResponse.json({
        ok: true,
        message: 'Usuário de trocas criado.',
        login: EMAIL_TROCAS,
        senha: SENHA_TROCAS,
      })
    }

    await prisma.user.update({
      where: { id: userTrocas.id },
      data: {
        passwordHash: hashTrocas,
        active: true,
        name: 'Trocas (funcionário)',
        role: Role.TROCAS,
      },
    })
    return NextResponse.json({
      ok: true,
      message: 'Usuário de trocas atualizado (senha redefinida para 112233).',
      login: EMAIL_TROCAS,
      senha: SENHA_TROCAS,
    })
  } catch (error) {
    console.error('Erro ao garantir usuário trocas:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
