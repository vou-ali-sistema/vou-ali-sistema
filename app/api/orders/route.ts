import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const criarOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email(),
  }),
  items: z.array(z.object({
    itemType: z.enum(['ABADA', 'PULSEIRA_EXTRA']),
    size: z.string().optional(),
    quantity: z.number().int().positive(),
  })),
  lotId: z.string().optional(), // ID do lote selecionado pelo usuário
})

export async function POST(request: NextRequest) {
  try {
    // Import dinâmico para evitar problemas de inicialização
    const { prisma } = await import('@/lib/prisma')
    const { isPurchaseEnabled } = await import('@/lib/settings')
    
    const purchaseEnabled = await isPurchaseEnabled()
    if (!purchaseEnabled) {
      return NextResponse.json(
        { error: 'Compras temporariamente indisponíveis. Aguarde ou entre em contato com a organização.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = criarOrderSchema.parse(body)

    // Validar tamanho obrigatório para ABADA
    for (const item of data.items) {
      if (item.itemType === 'ABADA' && !item.size) {
        return NextResponse.json(
          { error: 'Tamanho é obrigatório para ABADA' },
          { status: 400 }
        )
      }
      if (item.itemType === 'PULSEIRA_EXTRA' && item.size) {
        return NextResponse.json(
          { error: 'PULSEIRA_EXTRA não deve ter tamanho' },
          { status: 400 }
        )
      }
    }

    // Buscar lote ativo
    // Se lotId foi fornecido, usar esse lote específico; caso contrário, usar o primeiro encontrado
    let activeLot
    if (data.lotId) {
      activeLot = await prisma.lot.findFirst({
        where: { 
          id: data.lotId,
          active: true 
        },
      })
      if (!activeLot) {
        return NextResponse.json(
          { error: 'Lote selecionado não está mais ativo ou não foi encontrado.' },
          { status: 400 }
        )
      }
    } else {
      // Buscar primeiro lote ativo (compatibilidade com código antigo)
      activeLot = await prisma.lot.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      })
      if (!activeLot) {
        return NextResponse.json(
          { error: 'Nenhum lote ativo encontrado. Configure um lote ativo no painel admin.' },
          { status: 500 }
        )
      }
    }

    // Calcular total em centavos usando preços do lote
    let totalValueCents = 0
    const itemsWithPrices = data.items.map(item => {
      const unitPriceCents = item.itemType === 'ABADA' 
        ? activeLot.abadaPriceCents 
        : activeLot.pulseiraPriceCents
      const itemTotal = unitPriceCents * item.quantity
      totalValueCents += itemTotal
      
      return {
        ...item,
        unitPriceCents,
      }
    })

    // Criar ou buscar cliente por telefone
    const customer = await prisma.customer.upsert({
      where: { 
        phone: data.customer.phone 
      },
      update: {
        name: data.customer.name,
        email: data.customer.email,
      },
      create: {
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email,
      }
    })

    // Criar pedido com lotId e preços congelados
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        lotId: activeLot.id,
        status: 'PENDENTE',
        totalValueCents,
        externalReference: undefined, // será atualizado após criar
        items: {
          create: itemsWithPrices.map(item => ({
            itemType: item.itemType,
            size: item.size,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents, // Preço congelado do lote
          }))
        }
      },
      include: {
        items: true,
        customer: true,
        lot: true,
      }
    })

    // Atualizar externalReference com o ID
    await prisma.order.update({
      where: { id: order.id },
      data: { externalReference: order.id }
    })

    // Criar preferência Mercado Pago
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.warn('MERCADOPAGO_ACCESS_TOKEN não configurado. Pedido criado sem link de pagamento.')
      return NextResponse.json({
        orderId: order.id,
        paymentLink: null,
        warning: 'Mercado Pago não configurado. Configure o MERCADOPAGO_ACCESS_TOKEN no Vercel (Environment Variables).',
      })
    }

    try {
      const { criarPreferenciaPedido } = await import('@/lib/mercado-pago')
      const preference = await criarPreferenciaPedido(order.id)
      
      await prisma.order.update({
        where: { id: order.id },
        data: {
          mpPreferenceId: preference.id,
          paymentLink: preference.init_point,
        }
      })

      return NextResponse.json({
        orderId: order.id,
        paymentLink: preference.init_point,
      })
    } catch (mpError: any) {
      console.error('Erro ao criar preferência Mercado Pago:', mpError)
      
      // Extrair mensagem de erro mais detalhada
      let errorMessage = 'Erro desconhecido'
      if (mpError instanceof Error) {
        errorMessage = mpError.message
      } else if (mpError?.response?.data) {
        errorMessage = JSON.stringify(mpError.response.data)
      } else if (mpError?.message) {
        errorMessage = mpError.message
      } else if (typeof mpError === 'string') {
        errorMessage = mpError
      } else {
        errorMessage = JSON.stringify(mpError)
      }
      
      // Se falhar, ainda retornar o pedido criado, mas sem link de pagamento
      return NextResponse.json({
        orderId: order.id,
        paymentLink: null,
        warning: 'Erro ao gerar link de pagamento. Pedido criado, mas é necessário configurar o Mercado Pago.',
        details: errorMessage
      })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao criar pedido:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Erro ao criar pedido', details: errorMessage },
      { status: 500 }
    )
  }
}
