// backend/scripts/cleanup-all-certifications.ts
// Script para limpar TODAS as certificações antigas

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAllCertifications() {
  try {
    console.log('🧹 Limpando TODAS as certificações...');

    // Deletar TODAS as certificações
    const result = await prisma.modelCertification.deleteMany({});

    console.log(`✅ ${result.count} certificações foram removidas`);

    // Mostrar estatísticas atuais
    const stats = await prisma.modelCertification.groupBy({
      by: ['status'],
      _count: true
    });

    console.log('\n📊 Estatísticas atuais de certificações:');
    if (stats.length === 0) {
      console.log('  Nenhuma certificação no banco de dados');
    } else {
      stats.forEach(stat => {
        console.log(`  ${stat.status}: ${stat._count}`);
      });
    }

    // Contar total
    const total = await prisma.modelCertification.count();
    console.log(`\n📈 Total de certificações: ${total}`);

  } catch (error) {
    console.error('❌ Erro ao limpar certificações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAllCertifications();
