// backend/scripts/clear-failed-certifications.ts
// Standards: docs/STANDARDS.md

/**
 * Script para limpar certificações falhadas do banco de dados
 * 
 * Uso:
 *   npx ts-node backend/scripts/clear-failed-certifications.ts              # Limpa TODAS as certificações falhadas
 *   npx ts-node backend/scripts/clear-failed-certifications.ts <modelId>    # Limpa apenas o modelo específico
 * 
 * Exemplos:
 *   npx ts-node backend/scripts/clear-failed-certifications.ts
 *   npx ts-node backend/scripts/clear-failed-certifications.ts anthropic.claude-3-5-sonnet-20241022-v2:0
 * 
 * O script deleta certificações com:
 * - status = 'failed'
 * - errorCategory IN ('TIMEOUT', 'UNAVAILABLE', 'PERMISSION_ERROR', etc)
 * 
 * Após limpar, você pode forçar re-certificação usando:
 *   POST /api/certification/certify-model { modelId, force: true }
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearFailedCertifications(modelId?: string) {
  try {
    console.log('🧹 Iniciando limpeza de certificações falhadas...\n');

    // Construir filtro baseado em argumentos
    const whereClause: any = {
      OR: [
        { status: 'failed' },
        { 
          errorCategory: {
            in: [
              'TIMEOUT',
              'UNAVAILABLE',
              'PERMISSION_ERROR',
              'AUTHENTICATION_ERROR',
              'CONFIGURATION_ERROR',
              'RATE_LIMIT',
              'VALIDATION_ERROR'
            ]
          }
        }
      ]
    };

    // Se modelId fornecido, adicionar ao filtro
    if (modelId) {
      whereClause.modelId = modelId;
      console.log(`🎯 Modo: Limpar apenas modelo específico`);
      console.log(`   ModelId: ${modelId}\n`);
    } else {
      console.log(`🎯 Modo: Limpar TODAS as certificações falhadas\n`);
    }

    // Buscar certificações que serão deletadas (para mostrar antes)
    const toDelete = await prisma.modelCertification.findMany({
      where: whereClause,
      select: {
        id: true,
        modelId: true,
        status: true,
        errorCategory: true,
        lastError: true,
        lastTestedAt: true
      }
    });

    if (toDelete.length === 0) {
      console.log('✅ Nenhuma certificação falhada encontrada para limpar.');
      return;
    }

    console.log(`📋 Certificações que serão deletadas (${toDelete.length}):\n`);
    toDelete.forEach((cert, index) => {
      console.log(`${index + 1}. ${cert.modelId}`);
      console.log(`   Status: ${cert.status}`);
      console.log(`   Categoria: ${cert.errorCategory || 'N/A'}`);
      console.log(`   Último teste: ${cert.lastTestedAt?.toISOString() || 'N/A'}`);
      if (cert.lastError) {
        const errorPreview = cert.lastError.substring(0, 100);
        console.log(`   Erro: ${errorPreview}${cert.lastError.length > 100 ? '...' : ''}`);
      }
      console.log('');
    });

    // Confirmar antes de deletar (apenas se não for CI/CD)
    if (process.env.CI !== 'true') {
      console.log('⚠️  ATENÇÃO: Esta operação é irreversível!\n');
      console.log('Para confirmar, execute novamente com a variável CONFIRM=true:');
      console.log(`   CONFIRM=true npx ts-node backend/scripts/clear-failed-certifications.ts${modelId ? ` ${modelId}` : ''}\n`);
      
      if (process.env.CONFIRM !== 'true') {
        console.log('❌ Operação cancelada (CONFIRM não definido)');
        return;
      }
    }

    // Executar deleção
    console.log('🗑️  Deletando certificações...\n');
    const result = await prisma.modelCertification.deleteMany({
      where: whereClause
    });

    console.log(`✅ Limpeza concluída com sucesso!`);
    console.log(`   Certificações deletadas: ${result.count}\n`);

    // Mostrar resumo
    if (modelId) {
      console.log(`💡 Próximo passo: Re-certificar o modelo`);
      console.log(`   POST /api/certification/certify-model`);
      console.log(`   Body: { "modelId": "${modelId}", "force": true }\n`);
    } else {
      console.log(`💡 Próximo passo: Re-certificar os modelos`);
      console.log(`   Use force=true para ignorar cache antigo:`);
      console.log(`   POST /api/certification/certify-model`);
      console.log(`   Body: { "modelId": "<modelId>", "force": true }\n`);
    }

  } catch (error) {
    console.error('❌ Erro ao limpar certificações:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
const modelId = process.argv[2]; // Argumento opcional: modelId específico

clearFailedCertifications(modelId)
  .then(() => {
    console.log('🎉 Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
