import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Remover mídia de um card
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await prisma.promoCardMedia.delete({
      where: { id: params.mediaId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Mídia não encontrada' },
        { status: 404 }
      )
    }

    console.error('Erro ao deletar mídia:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar mídia' },
      { status: 500 }
    )
  }
}
