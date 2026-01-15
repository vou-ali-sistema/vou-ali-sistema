import { NextRequest } from 'next/server'
import { POST as mercadopagoPOST } from '../mercadopago/route'

// Alias para compatibilidade (alguns lugares podem ter configurado /mercado-pago)
export async function POST(request: NextRequest) {
  return mercadopagoPOST(request)
}
