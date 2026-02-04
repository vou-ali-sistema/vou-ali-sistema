/**
 * Script para redefinir a senha do admin para admin123
 * Use: npx tsx scripts/reset-admin-password.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const EMAIL = 'admin@vouali.com'
const SENHA = 'admin123'

async function main() {
  const passwordHash = await bcrypt.hash(SENHA, 10)

  const user = await prisma.user.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' } }
  })

  if (!user) {
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: EMAIL,
        passwordHash,
        role: 'ADMIN',
        active: true,
      },
    })
    console.log('Admin criado:', EMAIL, '| Senha:', SENHA)
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, active: true, email: EMAIL },
    })
    console.log('Senha do admin redefinida para:', SENHA)
  }
  console.log('Login: admin@vouali.com / admin123')
}

main()
  .catch((e) => {
    console.error('Erro:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
