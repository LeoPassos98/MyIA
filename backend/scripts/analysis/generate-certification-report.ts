// backend/scripts/generate-certification-report.ts
// Script para gerar relatório completo da certificação

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO DE CERTIFICAÇÃO DE MODELOS - MyIA');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // Ler Job ID do arquivo
    const fs = require('fs');
    const path = require('path');
    const rootDir = path.join(__dirname, '../..');
    const jobIdFile = path.join(rootDir, '.last-certification-job-id');
    
    let jobId = null;
    if (fs.existsSync(jobIdFile)) {
      jobId = fs.readFileSync(jobIdFile, 'utf8').trim();
      console.log(`🆔 Job ID: ${jobId}\n`);
    }
    
    // 1. Status do Job
    if (jobId) {
      console.log('📋 STATUS DO JOB:');
      console.log('─'.repeat(80));
      
      const job = await prisma.certificationJob.findUnique({
        where: { id: jobId }
      });
      
      if (job) {
        console.log(`  Status:           ${job.status}`);
        console.log(`  Tipo:             ${job.type}`);
        console.log(`  Regiões:          ${(job.regions as string[]).join(', ')}`);
        console.log(`  Total de Modelos: ${job.totalModels}`);
        console.log(`  Processados:      ${job.processedModels}`);
        console.log(`  Sucesso:          ${job.successCount}`);
        console.log(`  Falhas:           ${job.failureCount}`);
        console.log(`  Criado em:        ${job.createdAt.toISOString()}`);
        if (job.completedAt) {
          console.log(`  Concluído em:     ${job.completedAt.toISOString()}`);
        }
        console.log('');
      }
    }
    
    // 2. Estatísticas Gerais
    console.log('📊 ESTATÍSTICAS GERAIS:');
    console.log('─'.repeat(80));
    
    const totalModels = await prisma.aIModel.count({
      where: { isActive: true }
    });
    
    const certifiedModels = await prisma.modelCertification.count({
      where: { status: 'CERTIFIED' }
    });
    
    const failedModels = await prisma.modelCertification.count({
      where: { status: 'FAILED' }
    });
    
    console.log(`  Total de Modelos Ativos:     ${totalModels}`);
    console.log(`  Modelos Certificados:        ${certifiedModels}`);
    console.log(`  Modelos com Falha:           ${failedModels}`);
    console.log(`  Taxa de Sucesso:             ${totalModels > 0 ? ((certifiedModels / totalModels) * 100).toFixed(1) : 0}%`);
    console.log('');
    
    // 3. Detalhes por Modelo
    console.log('🔍 DETALHES POR MODELO:');
    console.log('─'.repeat(80));
    
    const models = await prisma.aIModel.findMany({
      where: { isActive: true },
      include: {
        provider: true,
        certifications: {
          orderBy: { certifiedAt: 'desc' },
          take: 1
        }
      }
    });
    
    console.log('');
    console.log(` ${'Modelo'.padEnd(30)} | ${'Provider'.padEnd(15)} | ${'Status'.padEnd(12)} | ${'Rating'.padEnd(8)} | ${'Badge'.padEnd(15)}`);
    console.log('─'.repeat(80));
    
    for (const model of models) {
      const cert = model.certifications[0];
      const status = cert ? cert.status : 'PENDING';
      const rating = cert?.rating ? cert.rating.toFixed(1) : 'N/A';
      const badge = cert?.badge || 'N/A';
      
      console.log(` ${model.name.padEnd(30)} | ${model.provider.name.padEnd(15)} | ${status.padEnd(12)} | ${rating.padEnd(8)} | ${badge.padEnd(15)}`);
    }
    
    console.log('');
    
    // 4. Certificações Recentes
    console.log('🕐 CERTIFICAÇÕES RECENTES (Últimas 10):');
    console.log('─'.repeat(80));
    
    const recentCerts = await prisma.modelCertification.findMany({
      orderBy: { certifiedAt: 'desc' },
      take: 10,
      include: {
        model: {
          include: {
            provider: true
          }
        }
      }
    });
    
    console.log('');
    for (const cert of recentCerts) {
      const timestamp = cert.certifiedAt?.toISOString() || 'N/A';
      const modelName = cert.model.name;
      const status = cert.status;
      const rating = cert.rating ? cert.rating.toFixed(1) : 'N/A';
      
      console.log(`  [${timestamp}] ${modelName} - ${status} (Rating: ${rating})`);
    }
    
    console.log('');
    
    // 5. Distribuição por Rating
    console.log('⭐ DISTRIBUIÇÃO POR RATING:');
    console.log('─'.repeat(80));
    
    const ratingDistribution = await prisma.$queryRaw<Array<{rating_range: string, count: bigint}>>`
      SELECT 
        CASE 
          WHEN rating >= 4.5 THEN '4.5-5.0 ⭐⭐⭐⭐⭐'
          WHEN rating >= 4.0 THEN '4.0-4.5 ⭐⭐⭐⭐'
          WHEN rating >= 3.0 THEN '3.0-4.0 ⭐⭐⭐'
          WHEN rating >= 2.0 THEN '2.0-3.0 ⭐⭐'
          ELSE '0.0-2.0 ⭐'
        END as rating_range,
        COUNT(*) as count
      FROM model_certifications
      WHERE rating IS NOT NULL
      GROUP BY rating_range
      ORDER BY rating_range DESC
    `;
    
    console.log('');
    for (const dist of ratingDistribution) {
      const bar = '█'.repeat(Number(dist.count));
      console.log(`  ${dist.rating_range.padEnd(20)} ${bar} (${dist.count})`);
    }
    
    console.log('');
    
    // 6. Modelos com Melhor Performance
    console.log('🏆 TOP 5 MODELOS (Por Rating):');
    console.log('─'.repeat(80));
    
    const topModels = await prisma.modelCertification.findMany({
      where: {
        rating: { not: null }
      },
      orderBy: { rating: 'desc' },
      take: 5,
      include: {
        model: {
          include: {
            provider: true
          }
        }
      }
    });
    
    console.log('');
    let rank = 1;
    for (const cert of topModels) {
      const stars = '⭐'.repeat(Math.round(cert.rating || 0));
      console.log(`  ${rank}. ${cert.model.name} (${cert.model.provider.name})`);
      console.log(`     Rating: ${stars} ${cert.rating?.toFixed(2)} | Badge: ${cert.badge}`);
      if (cert.metrics) {
        const metrics = cert.metrics as any;
        console.log(`     Latência: ${metrics.averageLatency?.toFixed(0)}ms | Taxa de Sucesso: ${metrics.successRate?.toFixed(1)}%`);
      }
      console.log('');
      rank++;
    }
    
    // 7. Resumo Final
    console.log('='.repeat(80));
    console.log('📝 RESUMO FINAL:');
    console.log('='.repeat(80));
    console.log('');
    console.log(`✅ Certificação ${jobId ? 'concluída' : 'em andamento'}`);
    console.log(`📊 ${certifiedModels}/${totalModels} modelos certificados com sucesso`);
    console.log(`⚠️  ${failedModels} modelos com falha`);
    console.log('');
    console.log('🔗 Links Úteis:');
    console.log('  • Bull Board: http://localhost:3001/admin/queues');
    console.log('  • Frontend: http://localhost:3000');
    console.log('  • Backend API: http://localhost:3001');
    console.log('');
    console.log('='.repeat(80));
    console.log('');
    
  } catch (error: any) {
    console.error('\n❌ Erro ao gerar relatório:', error.message);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
generateReport()
  .then(() => {
    console.log('✅ Relatório gerado com sucesso!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
