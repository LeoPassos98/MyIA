// backend/scripts/recertify-all-models.ts
// Standards: docs/STANDARDS.md

/**
 * Script para re-certificar TODOS os modelos do registry de forma sequencial
 * 
 * Este script:
 * 1. Lista todos os modelos no registry
 * 2. Limpa todas as certificações existentes
 * 3. Re-certifica cada modelo sequencialmente (não paralelo)
 * 4. Adiciona delay entre certificações para evitar rate limiting
 * 5. Mostra progresso detalhado
 * 6. Gera relatório final
 * 
 * Uso:
 *   npx ts-node backend/scripts/recertify-all-models.ts [opções]
 * 
 * Opções:
 *   --yes              Pula confirmação (útil para CI/CD)
 *   --dry-run          Modo simulação (não executa realmente)
 *   --delay=N          Delay em ms entre modelos (padrão: 5000)
 *   --only=model1,...  Certificar apenas modelos específicos
 *   --skip-cleanup     Não limpar certificações antigas
 *   --max-retries=N    Máximo de tentativas por modelo (padrão: 2)
 * 
 * Exemplos:
 *   # Modo normal (com confirmação)
 *   npx ts-node backend/scripts/recertify-all-models.ts
 * 
 *   # Modo automático (sem confirmação)
 *   npx ts-node backend/scripts/recertify-all-models.ts --yes
 * 
 *   # Modo simulação
 *   npx ts-node backend/scripts/recertify-all-models.ts --dry-run
 * 
 *   # Delay customizado (10 segundos)
 *   npx ts-node backend/scripts/recertify-all-models.ts --delay=10000
 * 
 *   # Apenas alguns modelos
 *   npx ts-node backend/scripts/recertify-all-models.ts --only=amazon.nova-micro-v1:0,anthropic.claude-3-5-sonnet-20241022-v2:0
 */

import { PrismaClient } from '@prisma/client';
import { ModelRegistry } from '../src/services/ai/registry';
import { ModelCertificationService } from '../src/services/ai/certification/certification.service';
import { encryptionService } from '../src/services/encryptionService';
import { logger } from '../src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

interface Config {
  DELAY_BETWEEN_MODELS_MS: number;
  MAX_RETRIES_PER_MODEL: number;
  SKIP_ON_ERROR: boolean;
  DRY_RUN: boolean;
  SKIP_CONFIRMATION: boolean;
  SKIP_CLEANUP: boolean;
  ONLY_MODELS: string[];
}

const DEFAULT_CONFIG: Config = {
  DELAY_BETWEEN_MODELS_MS: 5000, // 5 segundos entre modelos
  MAX_RETRIES_PER_MODEL: 2, // Máximo de tentativas por modelo
  SKIP_ON_ERROR: true, // Continuar mesmo se um modelo falhar
  DRY_RUN: false, // Modo simulação (não executa realmente)
  SKIP_CONFIRMATION: false, // Pular confirmação do usuário
  SKIP_CLEANUP: false, // Não limpar certificações antigas
  ONLY_MODELS: [], // Lista de modelos específicos (vazio = todos)
};

// ============================================================================
// TIPOS
// ============================================================================

interface CertificationResult {
  modelId: string;
  status: 'success' | 'failed' | 'skipped';
  rating?: number;
  badge?: string;
  successRate?: number;
  latencyMs?: number;
  error?: string;
  attempts: number;
}

interface Report {
  totalModels: number;
  successful: number;
  failed: number;
  skipped: number;
  totalTime: number;
  results: CertificationResult[];
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse argumentos da linha de comando
 */
function parseArgs(): Config {
  const config = { ...DEFAULT_CONFIG };
  const args = process.argv.slice(2);

  for (const arg of args) {
    if (arg === '--yes') {
      config.SKIP_CONFIRMATION = true;
    } else if (arg === '--dry-run') {
      config.DRY_RUN = true;
    } else if (arg === '--skip-cleanup') {
      config.SKIP_CLEANUP = true;
    } else if (arg.startsWith('--delay=')) {
      config.DELAY_BETWEEN_MODELS_MS = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--max-retries=')) {
      config.MAX_RETRIES_PER_MODEL = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--only=')) {
      config.ONLY_MODELS = arg.split('=')[1].split(',').map(m => m.trim());
    }
  }

  return config;
}

/**
 * Formata tempo em formato legível
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Formata rating com estrelas
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
 * Buscar credenciais AWS
 */
async function getAwsCredentials() {
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
    throw new Error('Nenhum usuário com credenciais AWS configuradas encontrado');
  }

  const { awsAccessKey, awsSecretKey, awsRegion } = user.settings;

  if (!awsAccessKey || !awsSecretKey || !awsRegion) {
    throw new Error('Credenciais AWS não configuradas');
  }

  // Descriptografar credenciais se estiverem criptografadas
  const decryptedAccessKey = awsAccessKey.startsWith('U2FsdGVkX1')
    ? encryptionService.decrypt(awsAccessKey)
    : awsAccessKey;
  
  const decryptedSecretKey = awsSecretKey.startsWith('U2FsdGVkX1')
    ? encryptionService.decrypt(awsSecretKey)
    : awsSecretKey;

  if (!decryptedAccessKey || !decryptedSecretKey) {
    throw new Error('Erro ao descriptografar credenciais AWS');
  }

  return {
    accessKey: decryptedAccessKey,
    secretKey: decryptedSecretKey,
    region: awsRegion
  };
}

/**
 * Certificar um modelo com retry
 */
async function certifyModelWithRetry(
  modelId: string,
  credentials: any,
  config: Config
): Promise<CertificationResult> {
  const service = new ModelCertificationService();
  let lastError: string | undefined;
  
  for (let attempt = 1; attempt <= config.MAX_RETRIES_PER_MODEL; attempt++) {
    try {
      console.log(`   Tentativa ${attempt}/${config.MAX_RETRIES_PER_MODEL}...`);
      
      if (config.DRY_RUN) {
        // Modo simulação
        await sleep(1000);
        return {
          modelId,
          status: 'success',
          rating: 4.5,
          badge: 'RECOMENDADO',
          successRate: 100,
          latencyMs: 1000,
          attempts: attempt
        };
      }
      
      // Executar certificação real
      await service.certifyModel(
        modelId,
        credentials,
        true // forçar re-certificação
      );

      // Buscar detalhes do banco
      const certDetails = await prisma.modelCertification.findUnique({
        where: { modelId }
      });

      return {
        modelId,
        status: 'success',
        rating: certDetails?.rating ?? undefined,
        badge: certDetails?.badge ?? undefined,
        successRate: certDetails?.successRate ?? undefined,
        latencyMs: certDetails?.avgLatencyMs ?? undefined,
        attempts: attempt
      };
      
    } catch (error: any) {
      lastError = error.message;
      console.log(`   ❌ Falha na tentativa ${attempt}: ${error.message}`);
      
      if (attempt < config.MAX_RETRIES_PER_MODEL) {
        console.log(`   ⏳ Aguardando 3s antes de tentar novamente...`);
        await sleep(3000);
      }
    }
  }
  
  // Todas as tentativas falharam
  return {
    modelId,
    status: 'failed',
    error: lastError,
    attempts: config.MAX_RETRIES_PER_MODEL
  };
}

/**
 * Limpar certificações antigas
 */
async function cleanupCertifications(config: Config): Promise<number> {
  if (config.DRY_RUN) {
    console.log('   [DRY-RUN] Certificações não foram deletadas');
    return 0;
  }
  
  const result = await prisma.modelCertification.deleteMany({});
  return result.count;
}

/**
 * Gerar relatório final
 */
function generateReport(report: Report, _config: Config): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL DE RE-CERTIFICAÇÃO');
  console.log('='.repeat(80));
  console.log('');
  
  // Estatísticas gerais
  console.log('📈 ESTATÍSTICAS GERAIS:');
  console.log('─'.repeat(80));
  console.log(`  Total de modelos:      ${report.totalModels}`);
  console.log(`  ✅ Sucesso:            ${report.successful} (${((report.successful / report.totalModels) * 100).toFixed(1)}%)`);
  console.log(`  ❌ Falha:              ${report.failed} (${((report.failed / report.totalModels) * 100).toFixed(1)}%)`);
  console.log(`  ⏭️  Pulados:            ${report.skipped}`);
  console.log(`  ⏱️  Tempo total:        ${formatTime(report.totalTime)}`);
  console.log(`  ⏱️  Tempo médio/modelo: ${formatTime(report.totalTime / report.totalModels)}`);
  console.log('');
  
  // Modelos bem-sucedidos
  if (report.successful > 0) {
    console.log('✅ MODELOS CERTIFICADOS COM SUCESSO:');
    console.log('─'.repeat(80));
    const successful = report.results.filter(r => r.status === 'success');
    successful.forEach((result, index) => {
      console.log(`${index + 1}. ${result.modelId}`);
      console.log(`   Rating: ${formatRating(result.rating)}`);
      console.log(`   Badge: ${formatBadge(result.badge)}`);
      console.log(`   Success Rate: ${result.successRate?.toFixed(1)}%`);
      console.log(`   Latência: ${result.latencyMs?.toFixed(0)}ms`);
      console.log(`   Tentativas: ${result.attempts}`);
      console.log('');
    });
  }
  
  // Modelos com falha
  if (report.failed > 0) {
    console.log('❌ MODELOS COM FALHA:');
    console.log('─'.repeat(80));
    const failed = report.results.filter(r => r.status === 'failed');
    failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.modelId}`);
      console.log(`   Erro: ${result.error}`);
      console.log(`   Tentativas: ${result.attempts}`);
      console.log('');
    });
  }
  
  // Modelos pulados
  if (report.skipped > 0) {
    console.log('⏭️  MODELOS PULADOS:');
    console.log('─'.repeat(80));
    const skipped = report.results.filter(r => r.status === 'skipped');
    skipped.forEach((result, index) => {
      console.log(`${index + 1}. ${result.modelId}`);
    });
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log('');
}

/**
 * Salvar log em arquivo
 */
function saveLogToFile(report: Report, config: Config): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `recertification-${timestamp}.log`;
  const filepath = path.join(__dirname, filename);
  
  const logContent = [
    '='.repeat(80),
    'RELATÓRIO DE RE-CERTIFICAÇÃO DE MODELOS',
    '='.repeat(80),
    '',
    `Data: ${new Date().toISOString()}`,
    `Modo: ${config.DRY_RUN ? 'DRY-RUN (Simulação)' : 'PRODUÇÃO'}`,
    `Delay entre modelos: ${config.DELAY_BETWEEN_MODELS_MS}ms`,
    `Max retries: ${config.MAX_RETRIES_PER_MODEL}`,
    `Skip on error: ${config.SKIP_ON_ERROR}`,
    '',
    '='.repeat(80),
    'ESTATÍSTICAS',
    '='.repeat(80),
    '',
    `Total de modelos: ${report.totalModels}`,
    `Sucesso: ${report.successful} (${((report.successful / report.totalModels) * 100).toFixed(1)}%)`,
    `Falha: ${report.failed} (${((report.failed / report.totalModels) * 100).toFixed(1)}%)`,
    `Pulados: ${report.skipped}`,
    `Tempo total: ${formatTime(report.totalTime)}`,
    '',
    '='.repeat(80),
    'RESULTADOS DETALHADOS',
    '='.repeat(80),
    '',
  ];
  
  report.results.forEach((result, index) => {
    logContent.push(`${index + 1}. ${result.modelId}`);
    logContent.push(`   Status: ${result.status}`);
    if (result.status === 'success') {
      logContent.push(`   Rating: ${result.rating?.toFixed(1) ?? 'N/A'}`);
      logContent.push(`   Badge: ${result.badge ?? 'N/A'}`);
      logContent.push(`   Success Rate: ${result.successRate?.toFixed(1)}%`);
      logContent.push(`   Latência: ${result.latencyMs?.toFixed(0)}ms`);
    } else if (result.status === 'failed') {
      logContent.push(`   Erro: ${result.error}`);
    }
    logContent.push(`   Tentativas: ${result.attempts}`);
    logContent.push('');
  });
  
  fs.writeFileSync(filepath, logContent.join('\n'));
  return filepath;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  const startTime = Date.now();
  const config = parseArgs();
  
  console.log('\n' + '='.repeat(80));
  console.log('🔄 RE-CERTIFICAÇÃO COMPLETA DE MODELOS');
  console.log('='.repeat(80));
  console.log('');
  
  if (config.DRY_RUN) {
    console.log('⚠️  MODO DRY-RUN (Simulação) - Nenhuma alteração será feita\n');
  }
  
  try {
    // 1. Listar modelos
    console.log('📦 Listando modelos do registry...\n');
    let models = ModelRegistry.getAllSupported();
    
    // Filtrar apenas modelos específicos se solicitado
    if (config.ONLY_MODELS.length > 0) {
      models = models.filter(m => config.ONLY_MODELS.includes(m.modelId));
      console.log(`🎯 Filtrando apenas modelos específicos: ${config.ONLY_MODELS.join(', ')}\n`);
    }
    
    console.log(`📊 Total de modelos: ${models.length}\n`);
    
    if (models.length === 0) {
      console.log('❌ Nenhum modelo encontrado para certificar');
      process.exit(1);
    }
    
    // Listar modelos
    console.log('📋 Modelos que serão certificados:');
    console.log('─'.repeat(80));
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.modelId} (${model.vendor})`);
    });
    console.log('');
    
    // 2. Mostrar aviso e confirmar
    console.log('⚠️  ATENÇÃO: Esta operação irá:');
    console.log('─'.repeat(80));
    if (!config.SKIP_CLEANUP) {
      console.log('   ✓ Limpar TODAS as certificações existentes');
    }
    console.log(`   ✓ Re-certificar ${models.length} modelos sequencialmente`);
    console.log(`   ✓ Delay de ${config.DELAY_BETWEEN_MODELS_MS / 1000}s entre cada modelo`);
    console.log(`   ✓ Até ${config.MAX_RETRIES_PER_MODEL} tentativas por modelo`);
    console.log(`   ✓ Tempo estimado: ~${formatTime((models.length * 30000) + (models.length * config.DELAY_BETWEEN_MODELS_MS))}`);
    console.log('');
    
    // Confirmar (se não for --yes)
    if (!config.SKIP_CONFIRMATION && !config.DRY_RUN) {
      console.log('Para confirmar, execute novamente com --yes:');
      console.log(`   npx ts-node backend/scripts/recertify-all-models.ts --yes\n`);
      console.log('❌ Operação cancelada (use --yes para confirmar)');
      process.exit(0);
    }
    
    // 3. Buscar credenciais AWS
    console.log('🔑 Buscando credenciais AWS...');
    const credentials = await getAwsCredentials();
    console.log(`✅ Credenciais encontradas (região: ${credentials.region})\n`);
    
    // 4. Limpar certificações antigas
    if (!config.SKIP_CLEANUP) {
      console.log('🗑️  Limpando certificações antigas...');
      const deletedCount = await cleanupCertifications(config);
      console.log(`✅ ${deletedCount} certificações limpas\n`);
    } else {
      console.log('⏭️  Pulando limpeza de certificações antigas\n');
    }
    
    // 5. Re-certificar sequencialmente
    console.log('🧪 Iniciando re-certificação sequencial...\n');
    console.log('='.repeat(80));
    
    const results: CertificationResult[] = [];
    
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const progress = `[${i + 1}/${models.length}]`;
      
      console.log(`\n${progress} Certificando: ${model.modelId}`);
      console.log(`   Vendor: ${model.vendor}`);
      console.log(`   Display: ${model.displayName}`);
      
      try {
        const result = await certifyModelWithRetry(model.modelId, credentials, config);
        results.push(result);
        
        if (result.status === 'success') {
          console.log(`   ✅ Sucesso!`);
          console.log(`   Rating: ${formatRating(result.rating)}`);
          console.log(`   Badge: ${formatBadge(result.badge)}`);
        } else {
          console.log(`   ❌ Falha após ${result.attempts} tentativas`);
          console.log(`   Erro: ${result.error}`);
          
          if (!config.SKIP_ON_ERROR) {
            throw new Error(`Certificação falhou para ${model.modelId}`);
          }
        }
        
      } catch (error: any) {
        console.log(`   ❌ Erro: ${error.message}`);
        results.push({
          modelId: model.modelId,
          status: 'failed',
          error: error.message,
          attempts: 0
        });
        
        if (!config.SKIP_ON_ERROR) {
          throw error;
        }
      }
      
      // Delay entre modelos (exceto no último)
      if (i < models.length - 1) {
        const delaySeconds = config.DELAY_BETWEEN_MODELS_MS / 1000;
        console.log(`   ⏳ Aguardando ${delaySeconds}s antes do próximo modelo...`);
        await sleep(config.DELAY_BETWEEN_MODELS_MS);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    
    // 6. Gerar relatório
    const endTime = Date.now();
    const report: Report = {
      totalModels: models.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      totalTime: endTime - startTime,
      results
    };
    
    generateReport(report, config);
    
    // 7. Salvar log
    const logFile = saveLogToFile(report, config);
    console.log(`💾 Log salvo em: ${logFile}\n`);
    
    // 8. Status final
    if (report.failed === 0) {
      console.log('🎉 Re-certificação concluída com sucesso!\n');
      process.exit(0);
    } else {
      console.log(`⚠️  Re-certificação concluída com ${report.failed} falhas\n`);
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('\n❌ Erro fatal:', error.message);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

main()
  .then(() => {
    // Sucesso já tratado no main()
  })
  .catch((error) => {
    console.error('💥 Erro não tratado:', error);
    process.exit(1);
  });
