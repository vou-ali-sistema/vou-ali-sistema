import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Endpoint de bootstrap para PRODUÇÃO:
 * - Cria o primeiro usuário ADMIN se ainda não existir nenhum usuário
 * - Protegido por BOOTSTRAP_TOKEN (ENV) para evitar abuso
 *
 * Use e depois REMOVA o BOOTSTRAP_TOKEN da Vercel.
 */
export async function POST(req: NextRequest) {
  try {
    const bootstrapToken = process.env.BOOTSTRAP_TOKEN
    if (!bootstrapToken) {
      return NextResponse.json(
        { error: 'BOOTSTRAP_TOKEN não configurado' },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => null)
    const tokenFromHeader = req.headers.get('x-bootstrap-token')
    const token = tokenFromHeader || body?.token

    if (!token || token !== bootstrapToken) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const usersCount = await prisma.user.count()
    if (usersCount > 0) {
      return NextResponse.json(
        { error: 'Bootstrap já realizado (já existe usuário)' },
        { status: 409 }
      )
    }

    const name = String(body?.name || 'Administrador').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '').trim()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'ADMIN',
        active: true,
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    })

    return NextResponse.json({ ok: true, user })
  } catch (err) {
    console.error('Erro no bootstrap:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'Erro ao executar bootstrap', details: message },
      { status: 500 }
    )
  }
}

