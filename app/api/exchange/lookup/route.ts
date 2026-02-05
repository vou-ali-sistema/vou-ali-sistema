import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const lookupSchema = z.object({
  token: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = lookupSchema.parse(body)

    // Limpar e normalizar o token
    let token = data.token.trim()
    
    // Decodificar URL caso necessário
    try {
      token = decodeURIComponent(token)
    } catch (e) {
      // Se falhar, usar o token original
    }
    
    const cleanToken = token.replace(/\s+/g, '').replace(/[^\w-]/g, '')

    // Tentar buscar com token limpo primeiro
    let order = await prisma.order.findUnique({
      where: { exchangeToken: cleanToken },
      include: {
        items: true,
        customer: true,
      }
    })
    
    // Se não encontrou, tentar com token original
    if (!order && cleanToken !== token) {
      order = await prisma.order.findUnique({
        where: { exchangeToken: token },
        include: {
          items: true,
          customer: true,
        }
      })
    }

    if (order) {
      return NextResponse.json({
        type: 'order',
        data: {
          id: order.id,
          customer: {
            name: order.customer.name,
            phone: order.customer.phone,
            email: order.customer.email,
          },
          status: order.status,
          items: order.items.map(item => ({
            id: item.id,
            itemType: item.itemType,
            size: item.size,
            quantity: item.quantity,
            deliveredQuantity: item.deliveredQuantity,
          })),
        }
      })
    }

    // Buscar Courtesy por exchangeToken (também com token limpo)
    let courtesy = await prisma.courtesy.findUnique({
      where: { exchangeToken: cleanToken },
      include: {
        items: true,
      }
    })
    
    if (!courtesy && cleanToken !== token) {
      courtesy = await prisma.courtesy.findUnique({
        where: { exchangeToken: token },
        include: {
          items: true,
        }
      })
    }

    if (courtesy) {
      return NextResponse.json({
        type: 'courtesy',
        data: {
          id: courtesy.id,
          name: courtesy.name,
          phone: courtesy.phone,
          status: courtesy.status,
          items: courtesy.items.map(item => ({
            id: item.id,
            itemType: item.itemType,
            size: item.size,
            quantity: item.quantity,
            deliveredQuantity: item.deliveredQuantity,
          })),
        }
      })
    }

    return NextResponse.json(
      { error: 'Token não encontrado' },
      { status: 404 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao buscar token:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar token' },
      { status: 500 }
    )
  }
}

