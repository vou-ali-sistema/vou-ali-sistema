import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Template CSV para enviar a alguém preencher: Nome completo, CPF, Telefone
const CSV_HEADERS = 'Nome completo,CPF,Telefone'
const CSV_EXAMPLE = 'João da Silva,12345678900,11999998888'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const csv = [CSV_HEADERS, CSV_EXAMPLE].join('\n')
    const bom = '\uFEFF'

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="lista-convidados-template.csv"',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar template:', error)
    return NextResponse.json({ error: 'Erro ao gerar template' }, { status: 500 })
  }
}
