import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const jobs = await prisma.certificationJob.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5,
  select: { 
    id: true, 
    status: true, 
    totalModels: true, 
    processedModels: true, 
    successCount: true,
    failureCount: true,
    createdAt: true 
  }
});

console.log('\n📋 Últimos 5 Jobs de Certificação:\n');
console.table(jobs);

await prisma.$disconnect();
