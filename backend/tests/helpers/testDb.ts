import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanupTestDb() {
  // Limpar todas as tabelas
  await prisma.user.deleteMany();
}

export async function closeTestDb() {
  await prisma.$disconnect();
}

export { prisma };