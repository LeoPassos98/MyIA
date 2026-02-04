// backend/scripts/cleanup-old-jobs.ts
// Script para limpar jobs antigos em QUEUED

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOldJobs() {
  try {
    console.log('🧹 Limpando jobs antigos em QUEUED...');

    // Deletar jobs em QUEUED com mais de 1 dia
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const result = await prisma.certificationJob.deleteMany({
      where: {
        status: 'QUEUED',
        createdAt: {
          lt: oneDayAgo
        }
      }
    });

    console.log(`✅ ${result.count} jobs antigos foram removidos`);

    // Mostrar estatísticas atuais
    const stats = await prisma.certificationJob.groupBy({
      by: ['status'],
      _count: true
    });

    console.log('\n📊 Estatísticas atuais:');
    stats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count}`);
    });

  } catch (error) {
    console.error('❌ Erro ao limpar jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldJobs();
