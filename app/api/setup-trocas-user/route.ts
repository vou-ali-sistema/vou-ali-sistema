/**
 * Cria ou atualiza o usuário vouali.trocas (senha 112233) em produção.
 * Use quando o login vouali.trocas der 401 e você não conseguir entrar como admin.
 *
 * GET /api/setup-trocas-user?token=SEU_NEXTAUTH_SECRET
 * (o token deve ser o mesmo valor da variável NEXTAUTH_SECRET no .env / Vercel)
 *
 * Depois de usar, faça login com: vouali.trocas / 112233
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_TROCAS = 'vouali.trocas'
const SENHA_TROCAS = '112233'

export async function GET(req: NextRequest) {
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: 'NEXTAUTH_SECRET não configurado' },
        { status: 500 }
      )
    }

    const token = req.nextUrl.searchParams.get('token')
    if (!token || token !== secret) {
      return NextResponse.json(
        { error: 'Token inválido. Use ?token=SEU_NEXTAUTH_SECRET (o valor da variável NEXTAUTH_SECRET na Vercel).' },
        { status: 401 }
      )
    }

    // Garantir que o enum Role tem TROCAS (PostgreSQL)
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TROCAS'`)
    } catch {
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
        message: 'Usuário vouali.trocas criado. Faça login com: vouali.trocas / 112233',
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
      message: 'Usuário vouali.trocas atualizado (senha redefinida para 112233). Faça login com: vouali.trocas / 112233',
      login: EMAIL_TROCAS,
      senha: SENHA_TROCAS,
    })
  } catch (error) {
    console.error('Erro ao configurar usuário trocas:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
