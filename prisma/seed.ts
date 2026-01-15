import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@vouali.com";
  const pass = "admin123";

  // Configurações padrão do sistema
  await prisma.appSetting.upsert({
    where: { key: "purchase_enabled" },
    update: {},
    create: { key: "purchase_enabled", valueBool: true },
  });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(pass, 10);
    await prisma.user.create({
      data: {
        name: "Admin",
        email,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log("Admin criado:", email, pass);
  } else {
    console.log("Admin já existe:", email);
  }

  // Criar "Lote 1" ativo com preços padrão
  const lote1 = await prisma.lot.findFirst({ where: { name: "Lote 1" } });
  if (!lote1) {
    // Desativar todos os lotes existentes
    await prisma.lot.updateMany({
      where: { active: true },
      data: { active: false },
    });

    // Criar Lote 1 ativo
    await prisma.lot.create({
      data: {
        name: "Lote 1",
        abadaPriceCents: 5000, // R$ 50,00
        pulseiraPriceCents: 2000, // R$ 20,00
        active: true,
      },
    });
    console.log("Lote 1 criado e ativado");
  } else {
    // Garantir que Lote 1 está ativo e outros desativados
    await prisma.$transaction(async (tx) => {
      await tx.lot.updateMany({
        where: { active: true, id: { not: lote1.id } },
        data: { active: false },
      });
      await tx.lot.update({
        where: { id: lote1.id },
        data: { active: true },
      });
    });
    console.log("Lote 1 já existe e está ativo");
  }
}

main()
  .finally(async () => prisma.$disconnect());
