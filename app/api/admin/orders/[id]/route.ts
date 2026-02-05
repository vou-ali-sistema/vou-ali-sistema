import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar se o pedido existe
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Deletar pedido e seus itens em transação
    await prisma.$transaction(async (tx) => {
      // Deletar itens primeiro (devido à foreign key)
      await tx.orderItem.deleteMany({
        where: { orderId: id },
      })

      // Deletar o pedido
      await tx.order.delete({
        where: { id },
      })
    })

    return NextResponse.json({ ok: true, deleted: true })
  } catch (error) {
    console.error('Erro ao deletar pedido:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Erro ao deletar pedido', details: msg }, { status: 500 })
  }
}
