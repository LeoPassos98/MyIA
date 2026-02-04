// backend/scripts/cleanup-all-queued-jobs.ts
// Script para limpar TODOS os jobs em QUEUED

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAllQueuedJobs() {
  try {
    console.log('🧹 Limpando TODOS os jobs em QUEUED...');

    // Deletar TODOS os jobs em QUEUED
    const result = await prisma.certificationJob.deleteMany({
      where: {
        status: 'QUEUED'
      }
    });

    console.log(`✅ ${result.count} jobs em QUEUED foram removidos`);

    // Mostrar estatísticas atuais
    const stats = await prisma.certificationJob.groupBy({
      by: ['status'],
      _count: true
    });

    console.log('\n📊 Estatísticas atuais:');
    if (stats.length === 0) {
      console.log('  Nenhum job no banco de dados');
    } else {
      stats.forEach(stat => {
        console.log(`  ${stat.status}: ${stat._count}`);
      });
    }

    // Contar total
    const total = await prisma.certificationJob.count();
    console.log(`\n📈 Total de jobs: ${total}`);

  } catch (error) {
    console.error('❌ Erro ao limpar jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAllQueuedJobs();
