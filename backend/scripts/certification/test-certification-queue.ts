// backend/scripts/test-certification-queue.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { certificationQueueService } from '../src/services/queue/CertificationQueueService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCertificationQueue() {
  console.log('🧪 Testando CertificationQueueService...\n');

  try {
    // 1. Buscar um modelo de teste
    const testModel = await prisma.aIModel.findFirst({
      where: { isActive: true }
    });

    if (!testModel) {
      throw new Error('Nenhum modelo encontrado para teste');
    }

    console.log(`✅ Modelo de teste: ${testModel.name} (${testModel.id})\n`);

    // 2. Certificar modelo em uma região
    console.log('1️⃣ Testando certificação de modelo único...');
    const result = await certificationQueueService.certifyModel(
      testModel.id,
      'us-east-1',
      'test-user'
    );
    console.log(`✅ Job criado: ${result.jobId}`);
    console.log(`   Bull Job ID: ${result.bullJobId}\n`);

    // 3. Aguardar processamento
    console.log('⏳ Aguardando processamento (10s)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 4. Verificar status
    console.log('2️⃣ Verificando status do job...');
    const status = await certificationQueueService.getJobStatus(result.jobId);
    console.log(`✅ Status: ${status?.status}`);
    console.log(`   Processados: ${status?.processedModels}/${status?.totalModels}`);
    console.log(`   Sucesso: ${status?.successCount}`);
    console.log(`   Falhas: ${status?.failureCount}\n`);

    // 5. Obter estatísticas
    console.log('3️⃣ Obtendo estatísticas da fila...');
    const stats = await certificationQueueService.getQueueStats();
    console.log('✅ Estatísticas:');
    console.log(`   Fila - Waiting: ${stats.queue.waiting}`);
    console.log(`   Fila - Active: ${stats.queue.active}`);
    console.log(`   Fila - Completed: ${stats.queue.completed}`);
    console.log(`   Fila - Failed: ${stats.queue.failed}\n`);

    console.log('✅ Todos os testes passaram!\n');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testCertificationQueue();
