import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPurchaseEnabled, setPurchaseEnabled } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const purchaseEnabled = await isPurchaseEnabled()
  return NextResponse.json({ purchaseEnabled })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const purchaseEnabled = body?.purchaseEnabled
  if (typeof purchaseEnabled !== 'boolean') {
    return NextResponse.json({ error: 'Campo purchaseEnabled inválido' }, { status: 400 })
  }

  await setPurchaseEnabled(purchaseEnabled)
  return NextResponse.json({ purchaseEnabled })
}

