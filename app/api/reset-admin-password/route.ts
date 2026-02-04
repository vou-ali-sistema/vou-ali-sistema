/**
 * Redefine a senha do admin via API (usa o mesmo banco que o login).
 * GET /api/reset-admin-password
 * REMOVA esta rota após resolver o login.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const EMAIL = 'admin@vouali.com'
const SENHA = 'admin123'

export async function GET() {
  try {
    const passwordHash = await bcrypt.hash(SENHA, 10)

    const users = await prisma.user.findMany({
      where: { email: { equals: EMAIL, mode: 'insensitive' } },
    })

    if (users.length === 0) {
      await prisma.user.create({
        data: {
          name: 'Admin',
          email: EMAIL,
          passwordHash,
          role: 'ADMIN',
          active: true,
        },
      })
      return NextResponse.json({
        ok: true,
        mensagem: 'Admin criado',
        login: `${EMAIL} / ${SENHA}`,
      })
    }

    // Atualiza TODOS os usuários que batem (ex: admin@vouali.com e Admin@vouali.com)
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, active: true },
      })
    }

    // Verifica se o hash bate (leitura fresh do banco)
    const refreshed = await prisma.user.findFirst({
      where: { email: { equals: EMAIL, mode: 'insensitive' } },
    })
    const senhaVerifica = refreshed
      ? await bcrypt.compare(SENHA, refreshed.passwordHash)
      : false

    return NextResponse.json({
      ok: true,
      mensagem: 'Senha redefinida',
      atualizados: users.length,
      emails: users.map((u) => u.email),
      senhaVerifica,
      login: `${EMAIL} / ${SENHA}`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { ok: false, erro: message },
      { status: 500 }
    )
  }
}
