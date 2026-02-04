/**
 * Rota de diagnóstico para login - REMOVA após resolver o problema
 * Acesse: GET http://localhost:3000/api/debug-auth
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const email = 'admin@vouali.com'
    const senhaTeste = 'admin123'

    const user = await prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase(), mode: 'insensitive' } },
    })

    if (!user) {
      return NextResponse.json({
        ok: false,
        problema: 'Usuário admin@vouali.com não existe no banco',
        solucao: 'Execute: npm run reset-admin',
      })
    }

    const senhaOk = await bcrypt.compare(senhaTeste, user.passwordHash)

    if (!senhaOk) {
      return NextResponse.json({
        ok: false,
        problema: 'Senha admin123 não confere com o hash no banco',
        usuarioExiste: true,
        ativo: user.active,
        solucao: 'Execute: npm run reset-admin',
      })
    }

    if (!user.active) {
      return NextResponse.json({
        ok: false,
        problema: 'Usuário está inativo (active: false)',
        solucao: 'Execute: npm run reset-admin (o script reativa o usuário)',
      })
    }

    return NextResponse.json({
      ok: true,
      mensagem: 'Tudo certo. Login deve funcionar com admin@vouali.com / admin123',
    })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      erro: err.message,
      solucao: 'Verifique se o PostgreSQL está rodando e a DATABASE_URL no .env está correta',
    }, { status: 500 })
  }
}
