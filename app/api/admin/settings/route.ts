import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPurchaseEnabled, setPurchaseEnabled, getMercadoPagoTaxaPercent, setMercadoPagoTaxaPercent } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const purchaseEnabled = await isPurchaseEnabled()
  const mercadoPagoTaxaPercent = await getMercadoPagoTaxaPercent()
  return NextResponse.json({ purchaseEnabled, mercadoPagoTaxaPercent })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const purchaseEnabled = body?.purchaseEnabled
  const mercadoPagoTaxaPercent = body?.mercadoPagoTaxaPercent

  const result: any = {}

  if (typeof purchaseEnabled === 'boolean') {
    await setPurchaseEnabled(purchaseEnabled)
    result.purchaseEnabled = purchaseEnabled
  }

  if (typeof mercadoPagoTaxaPercent === 'number') {
    if (mercadoPagoTaxaPercent < 0 || mercadoPagoTaxaPercent > 100) {
      return NextResponse.json({ error: 'Taxa do Mercado Pago deve estar entre 0 e 100' }, { status: 400 })
    }
    await setMercadoPagoTaxaPercent(mercadoPagoTaxaPercent)
    result.mercadoPagoTaxaPercent = mercadoPagoTaxaPercent
  }

  if (Object.keys(result).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
  }

  // Retornar valores atualizados
  if (!result.purchaseEnabled) {
    result.purchaseEnabled = await isPurchaseEnabled()
  }
  if (result.mercadoPagoTaxaPercent === undefined) {
    result.mercadoPagoTaxaPercent = await getMercadoPagoTaxaPercent()
  }

  return NextResponse.json(result)
}

