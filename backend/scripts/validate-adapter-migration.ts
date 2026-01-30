/**
 * @file validate-adapter-migration.ts
 * @description Valida migração de modelos para novos adapters
 */

import { AdapterFactory } from '../src/services/ai/adapters/adapter-factory';
import { prisma } from '../src/lib/prisma';
import { logger } from '../src/utils/logger';

interface ValidationResult {
  modelId: string;
  vendor: string;
  inferenceType: string;
  adapterType: string;
  supportsModel: boolean;
  status: 'OK' | 'WARNING' | 'ERROR';
  message?: string;
}

async function validateMigration() {
  logger.info('🔍 Validando migração de adapters...');
  
  // Buscar modelos certificados do banco de dados
  const certifications = await prisma.modelCertification.findMany({
    where: {
      status: {
        in: ['PASSED', 'QUALITY_WARNING']
      }
    }
  });
  
  const results: ValidationResult[] = [];
  
  logger.info(`📊 Total de modelos certificados: ${certifications.length}`);
  
  for (const cert of certifications) {
    try {
      // Detectar inference type
      const inferenceType = AdapterFactory.detectInferenceType(cert.modelId);
      const vendor = AdapterFactory.detectVendor(cert.modelId);
      
      // Validar se vendor foi detectado
      if (!vendor) {
        results.push({
          modelId: cert.modelId,
          vendor: 'UNKNOWN',
          inferenceType: inferenceType || 'UNKNOWN',
          adapterType: 'NONE',
          supportsModel: false,
          status: 'ERROR',
          message: `Vendor não detectado para modelo ${cert.modelId}`
        });
        continue;
      }
      
      // Criar adapter
      const adapter = AdapterFactory.createAdapter(vendor, inferenceType);
      
      // Validar suporte
      const supportsModel = adapter.supportsModel(cert.modelId);
      
      const result: ValidationResult = {
        modelId: cert.modelId,
        vendor,
        inferenceType: inferenceType || 'UNKNOWN',
        adapterType: adapter.constructor.name,
        supportsModel,
        status: supportsModel ? 'OK' : 'ERROR'
      };
      
      if (!supportsModel) {
        result.message = `Adapter ${adapter.constructor.name} não suporta modelo ${cert.modelId}`;
      }
      
      results.push(result);
      
    } catch (error) {
      results.push({
        modelId: cert.modelId,
        vendor: cert.vendor || 'UNKNOWN',
        inferenceType: 'UNKNOWN',
        adapterType: 'NONE',
        supportsModel: false,
        status: 'ERROR',
        message: (error as Error).message
      });
    }
  }
  
  // Estatísticas
  const ok = results.filter(r => r.status === 'OK').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  
  logger.info('\n📊 ESTATÍSTICAS DE VALIDAÇÃO');
  logger.info(`✅ OK: ${ok}/${results.length} (${(ok/results.length*100).toFixed(1)}%)`);
  logger.info(`❌ ERRORS: ${errors}/${results.length} (${(errors/results.length*100).toFixed(1)}%)`);
  
  // Agrupar por adapter type
  const byAdapter = results.reduce((acc, r) => {
    acc[r.adapterType] = (acc[r.adapterType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  logger.info('\n📊 DISTRIBUIÇÃO POR ADAPTER');
  Object.entries(byAdapter).forEach(([adapter, count]) => {
    logger.info(`  ${adapter}: ${count}`);
  });
  
  // Agrupar por vendor
  const byVendor = results.reduce((acc, r) => {
    acc[r.vendor] = (acc[r.vendor] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  logger.info('\n📊 DISTRIBUIÇÃO POR VENDOR');
  Object.entries(byVendor).forEach(([vendor, count]) => {
    logger.info(`  ${vendor}: ${count}`);
  });
  
  // Mostrar erros
  if (errors > 0) {
    logger.error('\n❌ MODELOS COM ERRO:');
    results.filter(r => r.status === 'ERROR').forEach(r => {
      logger.error(`  ${r.modelId}: ${r.message}`);
    });
  }
  
  // Fechar conexão Prisma
  await prisma.$disconnect();
  
  return results;
}

validateMigration()
  .then(() => process.exit(0))
  .catch(error => {
    logger.error('Erro na validação:', error);
    process.exit(1);
  });
