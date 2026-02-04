// backend/scripts/test-worker.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { certificationQueueService } from '../src/services/queue/CertificationQueueService';
import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';
import axios from 'axios';

const prisma = new PrismaClient();

async function checkBackend(): Promise<boolean> {
  try {
    await axios.get('http://localhost:3001/health', { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function testWorker() {
  console.log('🧪 Testando Worker de Certificação...\n');

  // Verificar se backend está rodando
  console.log('🔍 Verificando se backend está rodando...\n');
  
  if (!await checkBackend()) {
    console.error('❌ Backend não está rodando\n');
    console.log('Este teste requer que o backend esteja ativo.\n');
    console.log('Opções:');
    console.log('  1. Iniciar serviços: ./start.sh start both');
    console.log('  2. Verificar status: ./start.sh status both');
    console.log('  3. Usar script interativo: ./manage-certifications.sh\n');
    process.exit(1);
  }
  
  console.log('✅ Backend está rodando\n');

  try {
    // 1. Buscar modelo de teste
    console.log('1️⃣ Buscando modelo de teste...');
    const testModel = await prisma.aIModel.findFirst({
      where: { isActive: true }
    });

    if (!testModel) {
      throw new Error('Nenhum modelo ativo encontrado no banco de dados');
    }

    console.log(`✅ Modelo de teste encontrado: ${testModel.name} (${testModel.id})\n`);

    // 2. Criar job (será processado pelo worker)
    console.log('2️⃣ Criando job de certificação...');
    const result = await certificationQueueService.certifyModel(
      testModel.id,
      'us-east-1',
      'test-user'
    );
    console.log(`✅ Job criado com sucesso!`);
    console.log(`   Job ID: ${result.jobId}`);
    console.log(`   Bull Job ID: ${result.bullJobId}\n`);

    // 3. Aguardar processamento
    console.log('⏳ Aguardando worker processar o job...');
    console.log('   (Certifique-se de que o worker está rodando: npm run worker:dev)');
    console.log('   Aguardando 15 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 4. Verificar resultado no banco
    console.log('3️⃣ Verificando status do job...');
    const status = await certificationQueueService.getJobStatus(result.jobId);
    
    if (!status) {
      console.log('❌ Job não encontrado no banco de dados');
      return;
    }

    console.log(`✅ Status do job:`);
    console.log(`   Status: ${status.status}`);
    console.log(`   Tipo: ${status.type}`);
    console.log(`   Total de modelos: ${status.totalModels}`);
    console.log(`   Modelos processados: ${status.processedModels}`);
    console.log(`   Sucessos: ${status.successCount}`);
    console.log(`   Falhas: ${status.failureCount}\n`);

    // 5. Verificar certificação no banco
    console.log('4️⃣ Verificando certificação no banco...');
    const certification = await prisma.modelCertification.findUnique({
      where: {
        modelId_region: {
          modelId: testModel.id,
          region: 'us-east-1'
        }
      }
    });

    if (!certification) {
      console.log('❌ Certificação não encontrada no banco de dados');
      return;
    }

    console.log(`✅ Certificação encontrada:`);
    console.log(`   Status: ${certification.status}`);
    console.log(`   Passou: ${certification.passed}`);
    console.log(`   Score: ${certification.score}`);
    console.log(`   Rating: ${certification.rating}`);
    console.log(`   Duração: ${certification.duration}ms`);
    console.log(`   Iniciado em: ${certification.startedAt}`);
    console.log(`   Completado em: ${certification.completedAt}\n`);

    // 6. Verificar se worker processou
    if (certification.status === 'PENDING' || certification.status === 'QUEUED') {
      console.log('⚠️  ATENÇÃO: Job ainda não foi processado pelo worker!');
      console.log('   Certifique-se de que o worker está rodando:');
      console.log('   cd backend && npm run worker:dev\n');
    } else if (certification.status === 'COMPLETED') {
      console.log('✅ SUCESSO! Worker processou o job corretamente!\n');
    } else if (certification.status === 'FAILED') {
      console.log('❌ Job falhou durante processamento');
      console.log(`   Erro: ${certification.errorMessage}`);
      console.log(`   Categoria: ${certification.errorCategory}\n`);
    }

    console.log('✅ Teste concluído!\n');

  } catch (error: any) {
    console.error('❌ Erro durante teste:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Executar teste
testWorker();
