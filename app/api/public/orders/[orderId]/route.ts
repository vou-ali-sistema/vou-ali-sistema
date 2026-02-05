import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Endpoint público para consultar um pedido por ID
 * Retorna informações básicas do pedido para o cliente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId || orderId.trim() === '') {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: {
            id: true,
            itemType: true,
            size: true,
            quantity: true,
            unitPriceCents: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        lot: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Retornar apenas informações seguras para o cliente
    return NextResponse.json({
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalValueCents: order.totalValueCents,
      exchangeToken: order.exchangeToken,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      items: order.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        size: item.size,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.quantity * item.unitPriceCents,
      })),
      customer: {
        name: order.customer.name,
        // Não retornar email/phone por segurança, mas pode ser útil para validação
        // email: order.customer.email,
        // phone: order.customer.phone,
      },
      lot: order.lot ? {
        id: order.lot.id,
        name: order.lot.name,
      } : null,
    })
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedido' },
      { status: 500 }
    )
  }
}
