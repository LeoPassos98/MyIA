import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Deletar jobs QUEUED com 0 modelos
const deleted = await prisma.certificationJob.deleteMany({
  where: {
    status: 'QUEUED',
    totalModels: 0
  }
});

console.log(`✅ Deletados ${deleted.count} jobs inválidos`);

await prisma.$disconnect();
