// backend/scripts/test-sync-banco-fila.ts
// Script para testar sincronização Banco ↔ Fila

import { PrismaClient } from '@prisma/client';
import { certificationQueueService } from '../src/services/queue/CertificationQueueService';
import axios from 'axios';

const prisma = new PrismaClient();

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkBackend(): Promise<boolean> {
  try {
    await axios.get('http://localhost:3001/health', { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function testSyncBancoFila() {
  console.log('🧪 TESTE: Sincronização Banco ↔ Fila\n');

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
    // 1. Limpar jobs antigos
    console.log('🧹 Limpando jobs antigos...');
    await prisma.certificationJob.deleteMany({});
    await prisma.modelCertification.deleteMany({});
    console.log('✅ Jobs limpos\n');

    // 2. Buscar um modelo para testar
    const model = await prisma.aIModel.findFirst({
      where: { isActive: true }
    });

    if (!model) {
      console.error('❌ Nenhum modelo ativo encontrado');
      return;
    }

    console.log(`📦 Modelo selecionado: ${model.name} (${model.id})\n`);

    // 3. Criar job de certificação
    console.log('📝 Criando job de certificação...');
    const result = await certificationQueueService.certifyModel(
      model.id,
      'us-east-1',
      'test-user'
    );

    const { jobId } = result;
    console.log(`✅ Job criado: ${jobId}\n`);

    // 4. Monitorar status do job no banco
    console.log('👀 Monitorando status no banco...\n');

    for (let i = 0; i < 20; i++) {
      await sleep(1000);

      const job = await prisma.certificationJob.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        console.error('❌ Job não encontrado no banco');
        break;
      }

      console.log(`[${i + 1}s] Status: ${job.status} | Processados: ${job.processedModels}/${job.totalModels} | Sucesso: ${job.successCount} | Falha: ${job.failureCount}`);

      // Verificar se completou
      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        console.log('\n✅ Job finalizado!');
        console.log(`   Status final: ${job.status}`);
        console.log(`   Iniciado em: ${job.startedAt}`);
        console.log(`   Completado em: ${job.completedAt}`);
        console.log(`   Duração: ${job.duration}ms`);
        console.log(`   Processados: ${job.processedModels}/${job.totalModels}`);
        console.log(`   Sucesso: ${job.successCount}`);
        console.log(`   Falha: ${job.failureCount}`);

        // Verificar certificação
        const cert = await prisma.modelCertification.findUnique({
          where: {
            modelId_region: {
              modelId: model.id,
              region: 'us-east-1'
            }
          }
        });

        if (cert) {
          console.log('\n📊 Certificação:');
          console.log(`   Status: ${cert.status}`);
          console.log(`   Passou: ${cert.passed}`);
          console.log(`   Score: ${cert.score}`);
          console.log(`   Rating: ${cert.rating}`);
          console.log(`   Duração: ${cert.duration}ms`);
        }

        break;
      }

      // Timeout após 20 segundos
      if (i === 19) {
        console.log('\n⚠️  Timeout: Job não completou em 20 segundos');
        console.log(`   Status atual: ${job.status}`);
      }
    }

    console.log('\n✅ Teste concluído!');

  } catch (error: any) {
    console.error('\n❌ Erro no teste:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Executar teste
testSyncBancoFila();
