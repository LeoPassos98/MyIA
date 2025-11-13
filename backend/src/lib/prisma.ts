import { PrismaClient } from '@prisma/client';

// O 'globalThis' é um truque para garantir que em desenvolvimento (com 'npm run dev')
// não criemos um novo cliente a cada recarga (Hot Reload).
declare global {
  var prisma: PrismaClient | undefined;
}

// Cria o cliente se ele não existir
export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
