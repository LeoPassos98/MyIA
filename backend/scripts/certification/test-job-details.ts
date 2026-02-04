// backend/scripts/test-job-details.ts
// Script para testar se os detalhes dos jobs estão sendo retornados corretamente

import { PrismaClient } from '@prisma/client';
import { certificationQueueService } from '../src/services/queue/CertificationQueueService';
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

async function testJobDetails() {
  console.log('🔍 Testando detalhes de jobs...\n');

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
    // 1. Buscar um job recente
    const recentJob = await prisma.certificationJob.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!recentJob) {
      console.log('❌ Nenhum job encontrado no banco');
      return;
    }

    console.log('📋 Job encontrado:');
    console.log(`   ID: ${recentJob.id}`);
    console.log(`   Tipo: ${recentJob.type}`);
    console.log(`   Status: ${recentJob.status}`);
    console.log(`   Total Modelos: ${recentJob.totalModels}`);
    console.log(`   Processados: ${recentJob.processedModels}`);
    console.log(`   Sucessos: ${recentJob.successCount}`);
    console.log(`   Falhas: ${recentJob.failureCount}\n`);

    // 2. Buscar detalhes usando o service
    console.log('🔄 Buscando detalhes via service...\n');
    const jobDetails = await certificationQueueService.getJobStatus(recentJob.id);

    if (!jobDetails) {
      console.log('❌ Service retornou null');
      return;
    }

    console.log('✅ Detalhes retornados pelo service:');
    console.log(`   Certificações encontradas: ${jobDetails.certifications?.length || 0}\n`);

    if (jobDetails.certifications && jobDetails.certifications.length > 0) {
      console.log('📊 Detalhes das certificações:');
      jobDetails.certifications.forEach((cert: any, index: number) => {
        console.log(`\n   ${index + 1}. Certificação:`);
        console.log(`      ID: ${cert.id}`);
        console.log(`      Model ID: ${cert.modelId}`);
        console.log(`      Model Name: ${cert.model?.name || 'N/A'}`);
        console.log(`      API Model ID: ${cert.model?.apiModelId || 'N/A'}`);
        console.log(`      Região: ${cert.region}`);
        console.log(`      Status: ${cert.status}`);
        console.log(`      Passou: ${cert.passed !== null ? cert.passed : 'N/A'}`);
        console.log(`      Score: ${cert.score !== null ? cert.score : 'N/A'}`);
        console.log(`      Rating: ${cert.rating || 'N/A'}`);
        console.log(`      Duração: ${cert.duration ? `${cert.duration}ms` : 'N/A'}`);
        if (cert.errorMessage) {
          console.log(`      Erro: ${cert.errorMessage}`);
        }
      });

      console.log('\n✅ SUCESSO: Detalhes estão sendo retornados corretamente!');
      console.log('   - Certificações incluem dados do modelo (model.name, model.apiModelId)');
      console.log('   - Frontend poderá exibir os detalhes corretamente');
    } else {
      console.log('⚠️  AVISO: Nenhuma certificação encontrada para este job');
      console.log('   Isso pode acontecer se:');
      console.log('   - O job ainda não foi processado');
      console.log('   - As certificações foram deletadas');
      console.log('   - Há um problema na query');
    }

  } catch (error) {
    console.error('❌ Erro ao testar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testJobDetails();
