import { PrismaClient } from '@prisma/client';
import { CertificationQueueService } from '../src/services/queue/CertificationQueueService';

const prisma = new PrismaClient();

async function certifyAll() {
  try {
    const queueService = new CertificationQueueService();
    
    // Buscar todos os modelos ativos
    const models = await prisma.aiModel.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    console.log(`\n📊 Encontrados ${models.length} modelos ativos\n`);
    
    // Criar job para todos os modelos
    const regions = ['us-east-1'];
    const result = await queueService.certifyAllModels(regions);
    
    console.log('\n✅ Job criado com sucesso!');
    console.log(`📋 Job ID: ${result.jobId}`);
    console.log(`🔢 Total de certificações: ${result.totalJobs}`);
    console.log(`🌍 Regiões: ${regions.join(', ')}\n`);
    
    // Salvar Job ID
    const fs = require('fs');
    fs.writeFileSync('../.last-certification-job-id', result.jobId);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

certifyAll();
