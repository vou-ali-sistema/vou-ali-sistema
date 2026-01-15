import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WEBP' },
        { status: 400 }
      )
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 5MB' },
        { status: 400 }
      )
    }

    // Criar diretório se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${extension}`

    // Converter File para Buffer e salvar
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Em produção (Vercel), não dá pra gravar em public/uploads.
    // Use Vercel Blob se tiver token configurado.
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    const isVercel = !!process.env.VERCEL

    if (blobToken) {
      const blob = await put(`uploads/${fileName}`, buffer, {
        access: 'public',
        contentType: file.type,
        token: blobToken,
      })

      return NextResponse.json({
        success: true,
        url: blob.url,
        fileName: fileName,
        storage: 'vercel-blob',
      })
    }

    if (isVercel) {
      return NextResponse.json(
        {
          error:
            'Upload em produção requer armazenamento externo. Configure BLOB_READ_WRITE_TOKEN (Vercel Blob) para habilitar uploads.',
        },
        { status: 500 }
      )
    }

    // Dev/local: salvar no filesystem
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // Retornar URL da imagem local
    const imageUrl = `/uploads/${fileName}`

    return NextResponse.json({ 
      success: true, 
      url: imageUrl,
      fileName: fileName,
      storage: 'local',
    })
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload da imagem', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
