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

// Taxa do Mercado Pago (percentual, ex: 5 = 5%)
export async function getMercadoPagoTaxaPercent(): Promise<number> {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: 'mercado_pago_taxa_percent' },
      select: { valueText: true },
    })
    if (row?.valueText) {
      const parsed = parseFloat(row.valueText)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed
      }
    }
    // Padrão: 5%
    return 5.0
  } catch {
    return 5.0
  }
}

export async function setMercadoPagoTaxaPercent(percent: number): Promise<void> {
  if (percent < 0 || percent > 100) {
    throw new Error('Taxa deve estar entre 0 e 100')
  }
  await prisma.appSetting.upsert({
    where: { key: 'mercado_pago_taxa_percent' },
    update: { valueText: String(percent) },
    create: { key: 'mercado_pago_taxa_percent', valueText: String(percent) },
  })
}

