import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Log para debug
console.log('[activate route] Route handler loaded')

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Import dinâmico para evitar problemas de inicialização
    let session: { user?: { email?: string } } | null = null
    try {
      const { getServerSession } = await import('next-auth')
      const { authOptions } = await import('@/lib/auth')
      session = await getServerSession(authOptions)
    } catch (authErr) {
      console.error('activate lot: auth error', authErr)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    console.log('[activate route] Received ID:', id)
    
    if (!id || typeof id !== 'string') {
      console.error('[activate route] Invalid ID:', id)
      return NextResponse.json(
        { error: 'ID do lote inválido', details: `ID recebido: ${id}` },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/prisma')
    
    // Verificar se o lote existe antes de tentar ativar
    const lotExists = await prisma.lot.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    console.log('[activate route] Lot exists check:', lotExists ? `Sim - ${lotExists.name}` : 'Não')

    if (!lotExists) {
      return NextResponse.json(
        { error: 'Lote não encontrado', details: `ID procurado: ${id}` },
        { status: 404 }
      )
    }

    // Usar transação para garantir que só um lote fique ativo
    const result = await prisma.$transaction(async (tx) => {
      // Desativar todos os lotes
      await tx.lot.updateMany({
        where: { active: true },
        data: { active: false },
      })

      // Ativar o lote solicitado
      const activatedLot = await tx.lot.update({
        where: { id },
        data: { active: true },
      })

      const activeCount = await tx.lot.count({ where: { active: true } })
      return { activatedLot, activeCount }
    })

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('Erro ao ativar lote:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Erro ao ativar lote', details: errorMessage },
      { status: 500 }
    )
  }
}

