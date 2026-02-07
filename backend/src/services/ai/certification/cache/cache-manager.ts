// backend/src/services/ai/certification/cache/cache-manager.ts
// Standards: docs/STANDARDS.md

import { prisma } from '../../../../lib/prisma';
import { logger } from '../../../../utils/logger';
import {
  CertificationResult,
  ModelCertificationStatus,
  CategorizedError,
  ErrorSeverity
} from '../types';
import { categorizeError } from '../error-categorizer';

/**
 * Gerencia cache de certificações de modelos
 * 
 * Responsabilidades:
 * - Verificar se certificação existe em cache
 * - Validar se certificação está expirada
 * - Reconstruir resultado do cache
 * 
 * @example
 * const cacheManager = new CertificationCacheManager();
 * const cached = await cacheManager.getCached('model-id', 'us-east-1');
 * if (cached) {
 *   return cached; // Cache hit
 * }
 */
export class CertificationCacheManager {
  /**
   * Busca certificação no cache
   * 
   * @param modelId - ID do modelo
   * @param region - Região AWS
   * @returns Resultado em cache ou null se não encontrado/expirado
   */
  async getCached(modelId: string, region: string): Promise<CertificationResult | null> {
    logger.info('[CacheManager] Verificando cache', {
      modelId,
      region
    });
    
    const cached = await prisma.modelCertification.findUnique({
      where: { 
        modelId_region: { modelId, region } 
      }
    });
    
    if (!cached) {
      logger.info('[CacheManager] Cache miss: nenhuma certificação encontrada', {
        modelId
      });
      return null;
    }
    
    // Verificar se certificação está expirada
    if (cached.expiresAt) {
      const now = new Date();
      if (cached.expiresAt <= now) {
        logger.info('[CacheManager] Cache expirado', {
          modelId,
          expiresAt: cached.expiresAt,
          now
        });
        return null;
      }
    }
    
    // Reconstruir categorizedError se houver
    let categorizedError: CategorizedError | undefined;
    if (cached.errorCategory && cached.lastError) {
      categorizedError = categorizeError(cached.lastError);
    }
    
    logger.info('[CacheManager] Cache hit', {
      modelId,
      status: cached.status
    });
    
    // Retornar resultado do cache
    return {
      modelId: cached.modelId,
      status: cached.status as ModelCertificationStatus,
      testsPassed: cached.testsPassed,
      testsFailed: cached.testsFailed,
      successRate: cached.successRate,
      avgLatencyMs: cached.avgLatencyMs || 0,
      isCertified: cached.status === ModelCertificationStatus.CERTIFIED,
      isAvailable: cached.status === ModelCertificationStatus.CERTIFIED || cached.status === ModelCertificationStatus.QUALITY_WARNING,
      results: [], // Não retornamos resultados detalhados do cache
      categorizedError,
      overallSeverity: cached.errorSeverity as ErrorSeverity | undefined
    };
  }
}
