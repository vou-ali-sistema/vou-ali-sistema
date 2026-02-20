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
    lotId: z.string().optional(), // Se enviado, preço vem deste lote (permite um pedido com vários lotes)
  })),
  lotId: z.string().optional(), // Lote único para todos os itens (compatibilidade)
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

    // Resolver preço por item: cada item usa o lote do seu lotId (nunca usar só um lote para todos)
    const lotIdsToFetch = new Set<string>()
    if (data.lotId && String(data.lotId).trim()) lotIdsToFetch.add(String(data.lotId).trim())
    for (const item of data.items) {
      const id = item.lotId != null ? String(item.lotId).trim() : ''
      if (id) lotIdsToFetch.add(id)
    }
    const lots = lotIdsToFetch.size > 0
      ? await prisma.lot.findMany({ where: { id: { in: [...lotIdsToFetch] }, active: true } })
      : await prisma.lot.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' }, take: 1 })
    const lotMap = new Map(lots.map(l => [l.id, l]))
    const defaultLot = data.lotId ? lotMap.get(data.lotId) : lots[0]
    if (!defaultLot && lots.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum lote ativo encontrado. Configure um lote ativo no painel admin.' },
        { status: 500 }
      )
    }

    if (!defaultLot) {
      return NextResponse.json(
        { error: 'Nenhum lote ativo encontrado. Configure um lote ativo no painel admin.' },
        { status: 500 }
      )
    }

    let totalValueCents = 0
    const itemsWithPrices: Array<{ itemType: 'ABADA' | 'PULSEIRA_EXTRA'; size?: string; quantity: number; unitPriceCents: number }> = []
    for (const item of data.items) {
      const rawLotId = item.lotId != null ? String(item.lotId).trim() : ''
      const lot = rawLotId ? lotMap.get(rawLotId) : null
      if (rawLotId && !lot) {
        return NextResponse.json(
          { error: `Lote "${rawLotId}" não encontrado ou inativo. Recarregue a página e tente novamente.` },
          { status: 400 }
        )
      }
      const lotToUse = lot || defaultLot
      if (!lotToUse) {
        return NextResponse.json(
          { error: 'Nenhum lote definido para este item. Recarregue a página e selecione os lotes novamente.' },
          { status: 400 }
        )
      }
      const unitPriceCents = item.itemType === 'ABADA'
        ? lotToUse.abadaPriceCents
        : (lotToUse.pulseiraPriceCents || 0)
      totalValueCents += unitPriceCents * item.quantity
      itemsWithPrices.push({ ...item, unitPriceCents })
    }

    // Regra por lote: cada lote pode ter no máximo 1 pulseira por abadá do MESMO lote (não misturar feminino com masculino)
    const abadaPorLote = new Map<string, number>()
    const pulseiraPorLote = new Map<string, number>()
    const defaultId = defaultLot?.id ?? ''
    for (const item of data.items) {
      const lid = (item.lotId != null && String(item.lotId).trim()) ? String(item.lotId).trim() : defaultId
      if (!lid) continue
      const q = item.quantity || 0
      if (item.itemType === 'ABADA') abadaPorLote.set(lid, (abadaPorLote.get(lid) || 0) + q)
      if (item.itemType === 'PULSEIRA_EXTRA') pulseiraPorLote.set(lid, (pulseiraPorLote.get(lid) || 0) + q)
    }
    for (const [lotId, pulseiraQty] of pulseiraPorLote) {
      const abadaQty = abadaPorLote.get(lotId) || 0
      if (pulseiraQty > 0 && abadaQty === 0) {
        return NextResponse.json(
          { error: 'A pulseira é bonificação e só pode ser do mesmo lote do abadá. Você tem pulseira de um lote sem abadá desse lote.' },
          { status: 400 }
        )
      }
      if (pulseiraQty > abadaQty) {
        return NextResponse.json(
          { error: `Cada abadá dá direito a 1 pulseira do mesmo lote. Em um dos lotes você tem mais pulseiras do que abadás. Ajuste as quantidades por lote.` },
          { status: 400 }
        )
      }
    }

    const primaryLotId = defaultLot.id

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

    // Criar um único pedido com todos os itens (preços por lote já aplicados)
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        lotId: primaryLotId,
        status: 'PENDENTE',
        totalValueCents,
        externalReference: undefined, // será atualizado após criar
        items: {
          create: itemsWithPrices.map((item) => {
            const raw = (item as { lotId?: string }).lotId
            const itemLotId = raw != null && String(raw).trim() ? String(raw).trim() : primaryLotId
            return {
              itemType: item.itemType,
              size: item.size,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              lotId: itemLotId,
            }
          })
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
      const preferenceId = (preference as any).id ?? null
      const initPoint = (preference as any).init_point ?? null

      await prisma.order.update({
        where: { id: order.id },
        data: {
          mpPreferenceId: preferenceId,
          paymentLink: initPoint,
        }
      })

      return NextResponse.json({
        orderId: order.id,
        paymentLink: initPoint,
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
