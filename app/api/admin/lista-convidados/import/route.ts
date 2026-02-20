import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (inQuotes) {
      current += c
    } else if (c === ',' || c === ';') {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Envie um arquivo CSV' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV deve ter pelo menos a linha de cabeçalho e uma linha de dados' }, { status: 400 })
    }

    const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase())
    const nomeIdx = header.findIndex((h) => h.includes('nome'))
    const cpfIdx = header.findIndex((h) => h === 'cpf')
    const telIdx = header.findIndex((h) => h.includes('telefone') || h.includes('tel'))

    if (nomeIdx < 0 || cpfIdx < 0 || telIdx < 0) {
      return NextResponse.json(
        { error: 'CSV deve ter colunas: Nome completo, CPF, Telefone' },
        { status: 400 }
      )
    }

    const toInsert: { nomeCompleto: string; cpf: string; telefone: string }[] = []
    const cpfsVistos = new Set<string>()
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i])
      const nome = (cols[nomeIdx] ?? '').trim().replace(/^"|"$/g, '')
      const cpf = (cols[cpfIdx] ?? '').trim().replace(/\D/g, '')
      const telefone = (cols[telIdx] ?? '').trim().replace(/\D/g, '')
      if (!nome || !cpf) continue
      if (cpfsVistos.has(cpf)) continue
      cpfsVistos.add(cpf)
      toInsert.push({
        nomeCompleto: nome,
        cpf,
        telefone: telefone || '',
      })
    }

    if (toInsert.length === 0) {
      return NextResponse.json({ error: 'Nenhuma linha válida encontrada no CSV (nome e CPF obrigatórios, sem CPF duplicado no arquivo)' }, { status: 400 })
    }

    const cpfsExistentes = await prisma.convidado.findMany({
      where: { cpf: { in: toInsert.map((r) => r.cpf) } },
      select: { cpf: true },
    })
    const setExistentes = new Set(cpfsExistentes.map((r) => r.cpf))
    const dataUnicos = toInsert.filter((r) => !setExistentes.has(r.cpf))

    if (dataUnicos.length > 0) {
      await prisma.convidado.createMany({
        data: dataUnicos,
        skipDuplicates: true,
      })
    }

    const ignorados = toInsert.length - dataUnicos.length
    return NextResponse.json({
      imported: dataUnicos.length,
      skippedDuplicates: ignorados,
    })
  } catch (error) {
    console.error('Erro ao importar CSV:', error)
    return NextResponse.json({ error: 'Erro ao importar lista' }, { status: 500 })
  }
}
