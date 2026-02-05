import { NextRequest, NextResponse } from 'next/server'

// Rota dinâmica porque pode usar searchParams
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    // Aceitar parâmetro opcional para filtrar por tipo (feminino/masculino)
    const gender = request.nextUrl.searchParams.get('gender') // 'FEMININO' | 'MASCULINO'
    
    let where: any = { active: true }
    
    // Se especificar gênero, filtrar pelo nome
    if (gender) {
      const genderUpper = gender.toUpperCase()
      if (genderUpper === 'FEMININO' || genderUpper === 'MASCULINO') {
        where = {
          active: true,
          name: { contains: genderUpper, mode: 'insensitive' },
        }
      }
    }
    
    const activeLots = await prisma.lot.findMany({
      where,
      select: {
        id: true,
        name: true,
        abadaPriceCents: true,
        pulseiraPriceCents: true,
        pulseiraName: true, // Nome/descrição da pulseira
        abadaProducedQty: true,
        pulseiraProducedQty: true,
      },
      orderBy: { createdAt: 'desc' }, // Mais recente primeiro
    })

    if (activeLots.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum lote ativo encontrado' },
        { status: 404 }
      )
    }

    // Se houver apenas um, retornar como objeto (compatibilidade)
    // Se houver múltiplos, retornar array
    // Cache desabilitado para garantir que lotes ativados apareçam imediatamente
    if (activeLots.length === 1) {
      return NextResponse.json(activeLots[0], {
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    }

    // Múltiplos lotes ativos - retornar array
    return NextResponse.json(activeLots, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar lote ativo:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar lote ativo' },
      { status: 500 }
    )
  }
}
