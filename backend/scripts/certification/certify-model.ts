// backend/scripts/certify-model.ts
// Standards: docs/STANDARDS.md

/**
 * Script para certificar um modelo individual e exibir seu rating
 * 
 * Uso:
 *   npx ts-node backend/scripts/certify-model.ts <modelId>
 * 
 * Exemplo:
 *   npx ts-node backend/scripts/certify-model.ts amazon.nova-micro-v1:0
 * 
 * O script:
 * 1. Certifica o modelo especificado
 * 2. Calcula o rating automaticamente
 * 3. Salva no banco de dados
 * 4. Exibe relatório detalhado com rating, badge, métricas e scores
 */

import { PrismaClient } from '@prisma/client';
import { ModelCertificationService } from '../src/services/ai/certification/certification.service';
import { encryptionService } from '../src/services/encryptionService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

/**
 * Formata rating com estrelas visuais
 */
function formatRating(rating: number | null | undefined): string {
  if (rating === null || rating === undefined) {
    return '⚠️ N/A';
  }
  
  const stars = '⭐'.repeat(Math.round(rating));
  return `${stars} ${rating.toFixed(1)}`;
}

/**
 * Formata badge com emoji
 */
function formatBadge(badge: string | null | undefined): string {
  if (!badge) return '⚠️ N/A';
  
  const badgeEmojis: Record<string, string> = {
    'PREMIUM': '🏆',
    'RECOMENDADO': '✅',
    'FUNCIONAL': '⚠️',
    'LIMITADO': '🔶',
    'NÃO RECOMENDADO': '⚠️',
    'INDISPONÍVEL': '❌'
  };
  
  const emoji = badgeEmojis[badge] || '❓';
  return `${emoji} ${badge}`;
}

/**
 * Certifica um modelo e exibe relatório detalhado
 */
async function certifyModel(modelId: string) {
  console.log('🚀 Iniciando certificação de modelo...\n');
  console.log(`📦 Modelo: ${modelId}\n`);
  
  try {
    // Buscar credenciais AWS do usuário
    const user = await prisma.user.findFirst({
      where: {
        settings: {
          awsAccessKey: { not: null },
          awsSecretKey: { not: null },
          awsRegion: { not: null }
        }
      },
      include: {
        settings: true
      }
    });

    if (!user || !user.settings) {
      console.error('❌ Nenhum usuário com credenciais AWS configuradas encontrado.');
      console.error('💡 Configure as credenciais AWS primeiro.');
      process.exit(1);
    }

    const { awsAccessKey, awsSecretKey, awsRegion } = user.settings;

    if (!awsAccessKey || !awsSecretKey || !awsRegion) {
      console.error('❌ Credenciais AWS não configuradas.');
      console.error('💡 Configure AWS Access Key, Secret Key e Region nas configurações do usuário.');
      process.exit(1);
    }

    // Descriptografar credenciais se estiverem criptografadas
    const decryptedAccessKey = awsAccessKey.startsWith('U2FsdGVkX1')
      ? encryptionService.decrypt(awsAccessKey)
      : awsAccessKey;
    
    const decryptedSecretKey = awsSecretKey.startsWith('U2FsdGVkX1')
      ? encryptionService.decrypt(awsSecretKey)
      : awsSecretKey;

    if (!decryptedAccessKey || !decryptedSecretKey) {
      console.error('❌ Erro ao descriptografar credenciais AWS.');
      console.error('💡 Verifique se ENCRYPTION_SECRET está configurado corretamente no .env');
      process.exit(1);
    }

    const credentials = {
      accessKey: decryptedAccessKey,
      secretKey: decryptedSecretKey,
      region: awsRegion
    };

    console.log(`🔑 Credenciais AWS encontradas (região: ${awsRegion})`);
    console.log(`🔓 Credenciais descriptografadas com sucesso\n`);

    // Executar certificação
    console.log('🧪 Executando testes de certificação...\n');
    
    const service = new ModelCertificationService();
    const result = await service.certifyModel(
      modelId,
      credentials,
      true // forçar re-certificação
    );

    // Buscar detalhes completos do banco
    const certDetails = await prisma.modelCertification.findUnique({
      where: { modelId }
    });

    // Exibir relatório
    console.log('\n' + '='.repeat(60));
    console.log('✅ CERTIFICAÇÃO CONCLUÍDA');
    console.log('='.repeat(60));
    console.log('');
    
    console.log(`📦 Modelo: ${modelId}`);
    console.log(`📊 Status: ${result.status}`);
    console.log(`⭐ Rating: ${formatRating(certDetails?.rating)}`);
    console.log(`🏆 Badge: ${formatBadge(certDetails?.badge)}`);
    console.log('');

    // Métricas
    console.log('📊 MÉTRICAS:');
    console.log('─'.repeat(60));
    if (certDetails?.metrics) {
      const metrics = certDetails.metrics as any;
      console.log(`  Taxa de Sucesso:  ${metrics.successRate?.toFixed(1)}% (${result.testsPassed}/${result.testsPassed + result.testsFailed} testes)`);
      console.log(`  Retries Médios:   ${metrics.averageRetries?.toFixed(2)}`);
      console.log(`  Latência Média:   ${metrics.averageLatency?.toFixed(0)}ms`);
      console.log(`  Erros:            ${metrics.errorCount}`);
      console.log(`  Total de Testes:  ${metrics.totalTests}`);
    } else {
      console.log('  ⚠️ Métricas não disponíveis');
    }
    console.log('');

    // Scores
    console.log('🎯 SCORES INDIVIDUAIS:');
    console.log('─'.repeat(60));
    if (certDetails?.scores) {
      const scores = certDetails.scores as any;
      const successBar = '█'.repeat(Math.round((scores.success / 4.0) * 20));
      const resilienceBar = '█'.repeat(Math.round(scores.resilience * 20));
      const performanceBar = '█'.repeat(Math.round(scores.performance * 20));
      const stabilityBar = '█'.repeat(Math.round(scores.stability * 20));
      
      console.log(`  Success (40%):     ${scores.success.toFixed(2)}/4.0  ${successBar}`);
      console.log(`  Resilience (20%):  ${scores.resilience.toFixed(2)}/1.0  ${resilienceBar}`);
      console.log(`  Performance (20%): ${scores.performance.toFixed(2)}/1.0  ${performanceBar}`);
      console.log(`  Stability (20%):   ${scores.stability.toFixed(2)}/1.0  ${stabilityBar}`);
    } else {
      console.log('  ⚠️ Scores não disponíveis');
    }
    console.log('');

    // Detalhes dos testes
    if (result.results && result.results.length > 0) {
      console.log('🧪 DETALHES DOS TESTES:');
      console.log('─'.repeat(60));
      result.results.forEach((test) => {
        const emoji = test.passed ? '✅' : '❌';
        console.log(`  ${emoji} ${test.testName}: ${test.latencyMs}ms`);
        if (!test.passed && test.error) {
          console.log(`     Erro: ${test.error.substring(0, 80)}...`);
        }
      });
      console.log('');
    }

    // Recomendações
    console.log('💡 RECOMENDAÇÕES:');
    console.log('─'.repeat(60));
    if (certDetails?.rating !== null && certDetails?.rating !== undefined) {
      if (certDetails.rating >= 5.0) {
        console.log('  ✅ Modelo perfeito! Recomendado para produção crítica.');
        console.log('  ✅ Desempenho excelente em todos os aspectos.');
      } else if (certDetails.rating >= 4.0) {
        console.log('  ✅ Modelo confiável! Recomendado para uso em produção.');
        console.log('  ⚠️ Pequenas imperfeições, mas nada crítico.');
      } else if (certDetails.rating >= 3.0) {
        console.log('  ⚠️ Modelo funcional com limitações.');
        console.log('  🧪 Recomendado testar em desenvolvimento antes de produção.');
      } else if (certDetails.rating >= 2.0) {
        console.log('  🔶 Modelo com problemas significativos.');
        console.log('  ❌ Não recomendado para produção.');
      } else {
        console.log('  ❌ Modelo não recomendado ou indisponível.');
        console.log('  🔍 Revisar erros e considerar outro modelo.');
      }
    } else {
      console.log('  ⚠️ Rating não disponível.');
    }
    console.log('');

    // Informações adicionais
    if (certDetails) {
      console.log('📅 INFORMAÇÕES ADICIONAIS:');
      console.log('─'.repeat(60));
      console.log(`  Certificado em:     ${certDetails.certifiedAt?.toISOString() || 'N/A'}`);
      console.log(`  Rating atualizado:  ${certDetails.ratingUpdatedAt?.toISOString() || 'N/A'}`);
      console.log(`  Última verificação: ${certDetails.lastTestedAt?.toISOString() || 'N/A'}`);
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Erro ao certificar modelo:', error.message);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Validar argumentos
const modelId = process.argv[2];

if (!modelId) {
  console.error('❌ Erro: ModelId não fornecido.\n');
  console.error('Uso: npx ts-node scripts/certify-model.ts <modelId>\n');
  console.error('Exemplos:');
  console.error('  npx ts-node scripts/certify-model.ts amazon.nova-micro-v1:0');
  console.error('  npx ts-node scripts/certify-model.ts anthropic.claude-3-5-sonnet-20241022-v2:0');
  console.error('  npx ts-node scripts/certify-model.ts cohere.command-r-plus-v1:0');
  process.exit(1);
}

// Executar certificação
certifyModel(modelId)
  .then(() => {
    console.log('🎉 Certificação finalizada com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
