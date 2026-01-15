import { NextRequest, NextResponse } from 'next/server'
import { isPurchaseEnabled } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const purchaseEnabled = await isPurchaseEnabled()
  return NextResponse.json({ purchaseEnabled })
}

