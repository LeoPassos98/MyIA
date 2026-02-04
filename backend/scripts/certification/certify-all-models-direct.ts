// backend/scripts/certify-all-models-direct.ts
// Script para certificar todos os modelos ativos via CertificationQueueService

import { PrismaClient } from '@prisma/client';
import { CertificationQueueService } from '../src/services/queue/CertificationQueueService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function certifyAllModels() {
  console.log('\n🚀 Iniciando certificação de todos os modelos...\n');
  
  try {
    // Buscar todos os modelos ativos
    const models = await prisma.aIModel.findMany({
      where: { isActive: true },
      include: {
        provider: true
      }
    });
    
    console.log(`📊 Encontrados ${models.length} modelos ativos:\n`);
    models.forEach((model: any) => {
      console.log(`  • ${model.name} (${model.provider.name})`);
    });
    console.log('');
    
    // Criar job para todos os modelos
    const regions = ['us-east-1'];
    console.log(`🌍 Região: ${regions.join(', ')}\n`);
    console.log('📝 Criando job de certificação...\n');
    
    const queueService = new CertificationQueueService();
    const result = await queueService.certifyAllModels(regions);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ JOB CRIADO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('');
    console.log(`📋 Job ID: ${result.jobId}`);
    console.log(`🔢 Total de certificações: ${result.totalJobs}`);
    console.log(`🌍 Regiões: ${regions.join(', ')}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    
    // Salvar Job ID para referência
    const fs = require('fs');
    const path = require('path');
    const rootDir = path.join(__dirname, '../..');
    fs.writeFileSync(path.join(rootDir, '.last-certification-job-id'), result.jobId);
    console.log('💾 Job ID salvo em .last-certification-job-id\n');
    
    console.log('📊 PRÓXIMOS PASSOS:\n');
    console.log('  1. Monitorar progresso:');
    console.log('     ./manage-certifications.sh (opção 4)\n');
    console.log('  2. Ver logs:');
    console.log('     ./manage-certifications.sh (opção 9)\n');
    console.log('  3. Ver estatísticas:');
    console.log('     ./manage-certifications.sh (opção 7)\n');
    console.log('  4. Bull Board:');
    console.log('     http://localhost:3001/admin/queues\n');
    
  } catch (error: any) {
    console.error('\n❌ Erro ao criar job de certificação:', error.message);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
certifyAllModels()
  .then(() => {
    console.log('🎉 Script finalizado com sucesso!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
