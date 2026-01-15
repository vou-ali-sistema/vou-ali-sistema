import { prisma } from '@/lib/prisma'

export async function isPurchaseEnabled(): Promise<boolean> {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: 'purchase_enabled' },
      select: { valueBool: true },
    })
    // Padrão seguro: habilitado, para não travar ambiente novo
    return row?.valueBool !== false
  } catch {
    // Se a tabela ainda não existe (migração pendente), não bloquear por padrão.
    return true
  }
}

export async function setPurchaseEnabled(enabled: boolean): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: 'purchase_enabled' },
    update: { valueBool: enabled },
    create: { key: 'purchase_enabled', valueBool: enabled },
  })
}

