// backend/scripts/check-quality-warnings.ts
// Script para verificar modelos com quality_warning no banco

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando modelos com quality_warning...\n');
  
  const qualityWarnings = await prisma.modelCertification.findMany({
    where: {
      status: 'quality_warning'
    },
    select: {
      modelId: true,
      status: true,
      errorCategory: true,
      errorSeverity: true,
      testsPassed: true,
      testsFailed: true,
      successRate: true,
      lastError: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`📊 Total de modelos com quality_warning: ${qualityWarnings.length}\n`);
  
  if (qualityWarnings.length > 0) {
    console.log('Detalhes:');
    qualityWarnings.forEach((cert, index) => {
      console.log(`\n${index + 1}. ${cert.modelId}`);
      console.log(`   Status: ${cert.status}`);
      console.log(`   Categoria: ${cert.errorCategory}`);
      console.log(`   Severidade: ${cert.errorSeverity}`);
      console.log(`   Testes: ${cert.testsPassed} passou / ${cert.testsFailed} falhou`);
      console.log(`   Taxa de sucesso: ${cert.successRate}%`);
      console.log(`   Último erro: ${cert.lastError?.substring(0, 100)}...`);
      console.log(`   Criado em: ${cert.createdAt}`);
    });
  }
  
  console.log('\n🔍 Verificando modelos certificados...\n');
  
  const certified = await prisma.modelCertification.findMany({
    where: {
      status: 'certified'
    },
    select: {
      modelId: true,
      status: true,
      testsPassed: true,
      testsFailed: true,
      successRate: true
    },
    orderBy: {
      successRate: 'desc'
    },
    take: 5
  });
  
  console.log(`✅ Total de modelos certificados: ${certified.length}\n`);
  
  console.log('\n🔍 Verificando modelos indisponíveis...\n');
  
  const unavailable = await prisma.modelCertification.findMany({
    where: {
      status: 'failed',
      errorCategory: {
        in: ['UNAVAILABLE', 'PERMISSION_ERROR', 'AUTHENTICATION_ERROR', 'CONFIGURATION_ERROR']
      }
    },
    select: {
      modelId: true,
      status: true,
      errorCategory: true,
      errorSeverity: true
    },
    take: 5
  });
  
  console.log(`❌ Total de modelos indisponíveis: ${unavailable.length}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
