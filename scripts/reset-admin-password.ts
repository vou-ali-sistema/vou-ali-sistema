/**
 * Script para redefinir senhas do admin e do usuário de trocas.
 * Use: npx tsx scripts/reset-admin-password.ts
 */
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin
  const emailAdmin = 'admin@vouali.com'
  const senhaAdmin = 'admin123'
  const hashAdmin = await bcrypt.hash(senhaAdmin, 10)
  const userAdmin = await prisma.user.findFirst({
    where: { email: { equals: emailAdmin, mode: 'insensitive' } }
  })
  if (!userAdmin) {
    await prisma.user.create({
      data: { name: 'Admin', email: emailAdmin, passwordHash: hashAdmin, role: 'ADMIN', active: true },
    })
    console.log('Admin criado:', emailAdmin, '| Senha:', senhaAdmin)
  } else {
    await prisma.user.update({ where: { id: userAdmin.id }, data: { passwordHash: hashAdmin, active: true } })
    console.log('Senha do admin redefinida para:', senhaAdmin)
  }

  // Usuário Trocas (portaria / ler QR)
  const emailTrocas = 'vouali.trocas'
  const senhaTrocas = '112233'
  const hashTrocas = await bcrypt.hash(senhaTrocas, 10)
  const userTrocas = await prisma.user.findFirst({
    where: { email: { equals: emailTrocas, mode: 'insensitive' } }
  })
  if (!userTrocas) {
    await prisma.user.create({
      data: {
        name: 'Trocas (funcionário)',
        email: emailTrocas,
        passwordHash: hashTrocas,
        role: Role.TROCAS,
        active: true,
      },
    })
    console.log('Usuário trocas criado:', emailTrocas, '| Senha:', senhaTrocas)
  } else {
    await prisma.user.update({
      where: { id: userTrocas.id },
      data: { passwordHash: hashTrocas, active: true, name: 'Trocas (funcionário)', role: Role.TROCAS },
    })
    console.log('Senha do usuário trocas redefinida para:', senhaTrocas)
  }

  console.log('')
  console.log('--- Acessos ---')
  console.log('Admin:  ', emailAdmin, '/', senhaAdmin)
  console.log('Trocas: ', emailTrocas, '/', senhaTrocas)
  console.log('Página de login (ambos): /admin/login')
  console.log('Após login trocas: redireciona para /admin/trocas')
}

main()
  .catch((e) => {
    console.error('Erro:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
