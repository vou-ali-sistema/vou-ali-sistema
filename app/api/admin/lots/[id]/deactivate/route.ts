import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
      console.error('deactivate lot: auth error', authErr)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID do lote inválido' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/prisma')
    
    // Verificar se o lote existe
    const lotExists = await prisma.lot.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!lotExists) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      )
    }

    // Desativar o lote
    const deactivatedLot = await prisma.lot.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ deactivatedLot }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('Erro ao desativar lote:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Erro ao desativar lote', details: errorMessage },
      { status: 500 }
    )
  }
}
