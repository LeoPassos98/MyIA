// backend/src/services/ai/certification/cache/cache-manager.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { CertificationStatus } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';
import { logger } from '../../../../utils/logger';
import {
  CertificationResult,
  ModelCertificationStatus,
  CategorizedError,
  ErrorSeverity
} from '../types';
import { categorizeError } from '../error-categorizer';

// Provider slug padrão (AWS Bedrock)
const DEFAULT_PROVIDER_SLUG = 'bedrock';

/**
 * Mapeia CertificationStatus (Prisma) para ModelCertificationStatus (local)
 */
function mapFromPrismaStatus(status: CertificationStatus): ModelCertificationStatus {
  switch (status) {
    case CertificationStatus.PENDING:
      return ModelCertificationStatus.PENDING;
    case CertificationStatus.RUNNING:
      return ModelCertificationStatus.PROCESSING;
    case CertificationStatus.PASSED:
      return ModelCertificationStatus.CERTIFIED;
    case CertificationStatus.FAILED:
      return ModelCertificationStatus.FAILED;
    case CertificationStatus.ERROR:
      return ModelCertificationStatus.FAILED;
    case CertificationStatus.SKIPPED:
      return ModelCertificationStatus.CANCELLED;
    default:
      return ModelCertificationStatus.PENDING;
  }
}

/**
 * Gerencia cache de certificações de modelos
 * 
 * Responsabilidades:
 * - Verificar se certificação existe em cache
 * - Validar se certificação está expirada
 * - Reconstruir resultado do cache
 * 
 * Transição v1 → v2:
 * - Busca por deploymentId (FK) em vez de modelId (string)
 * - Resolve modelId (string do provider) para deploymentId (UUID)
 * 
 * @example
 * const cacheManager = new CertificationCacheManager();
 * const cached = await cacheManager.getCached('anthropic.claude-3-5-sonnet-20241022-v2:0', 'us-east-1');
 * if (cached) {
 *   return cached; // Cache hit
 * }
 */
export class CertificationCacheManager {
  /**
   * Resolve modelId (string do provider) para deploymentId (UUID)
   */
  private async resolveDeploymentId(modelId: string): Promise<string | null> {
    const provider = await prisma.provider.findUnique({
      where: { slug: DEFAULT_PROVIDER_SLUG }
    });

    if (!provider) {
      logger.warn('[CacheManager] Provider não encontrado', { 
        slug: DEFAULT_PROVIDER_SLUG 
      });
      return null;
    }

    const deployment = await prisma.modelDeployment.findUnique({
      where: {
        providerId_deploymentId: {
          providerId: provider.id,
          deploymentId: modelId
        }
      }
    });

    return deployment?.id || null;
  }

  /**
   * Busca certificação no cache
   * 
   * @param modelId - ID do modelo no provider (deploymentId string)
   * @param region - Região AWS
   * @returns Resultado em cache ou null se não encontrado/expirado
   */
  async getCached(modelId: string, region: string): Promise<CertificationResult | null> {
    logger.info('[CacheManager] Verificando cache', {
      modelId,
      region
    });
    
    // Resolver modelId para deploymentId (UUID)
    const deploymentId = await this.resolveDeploymentId(modelId);
    if (!deploymentId) {
      logger.info('[CacheManager] Cache miss: deployment não encontrado', {
        modelId
      });
      return null;
    }

    const cached = await prisma.modelCertification.findUnique({
      where: { 
        deploymentId_region: { deploymentId, region } 
      },
      include: {
        deployment: {
          select: {
            deploymentId: true
          }
        }
      }
    });
    
    if (!cached) {
      logger.info('[CacheManager] Cache miss: nenhuma certificação encontrada', {
        modelId,
        deploymentId
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
    
    // Mapear status do Prisma para status local
    const localStatus = mapFromPrismaStatus(cached.status);
    const isCertified = cached.status === CertificationStatus.PASSED;
    const isAvailable = cached.status === CertificationStatus.PASSED;
    
    logger.info('[CacheManager] Cache hit', {
      modelId,
      status: cached.status,
      localStatus
    });
    
    // Retornar resultado do cache
    return {
      modelId: cached.deployment?.deploymentId || modelId,
      status: localStatus,
      testsPassed: cached.testsPassed,
      testsFailed: cached.testsFailed,
      successRate: cached.successRate,
      avgLatencyMs: cached.avgLatencyMs || 0,
      isCertified,
      isAvailable,
      results: [], // Não retornamos resultados detalhados do cache
      categorizedError,
      overallSeverity: cached.errorSeverity as ErrorSeverity | undefined
    };
  }
}
