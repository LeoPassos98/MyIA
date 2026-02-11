// backend/src/services/ai/certification/queries/certification-queries.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { CertificationStatus } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';
import { CategorizedError } from '../types';
import { categorizeError } from '../error-categorizer';
import { logger } from '../../../../utils/logger';

// Região padrão para queries sem região especificada
const DEFAULT_REGION = 'us-east-1';

// Provider slug padrão (AWS Bedrock)
const DEFAULT_PROVIDER_SLUG = 'bedrock';

/**
 * Gerencia consultas de certificações no banco de dados
 * 
 * Responsabilidades:
 * - Buscar modelos certificados
 * - Buscar modelos que falharam
 * - Buscar modelos indisponíveis
 * - Buscar modelos com quality warning
 * - Verificar se modelo está certificado
 * - Obter detalhes completos de certificação
 * 
 * Transição v1 → v2:
 * - Queries agora usam deploymentId (FK) em vez de modelId (string)
 * - Retornam deploymentId (string do provider) para compatibilidade com API
 * - Usam CertificationStatus do Prisma (PASSED, FAILED, etc.)
 * 
 * @example
 * const queries = new CertificationQueries();
 * const certified = await queries.getCertifiedModels();
 * const isCert = await queries.isCertified('anthropic.claude-3-5-sonnet-20241022-v2:0', 'us-east-1');
 */
export class CertificationQueries {
  /**
   * Resolve modelId (string do provider) para deploymentId (UUID)
   * 
   * @param modelId - ID do modelo no provider
   * @returns UUID do deployment ou null se não encontrado
   */
  private async resolveDeploymentId(modelId: string): Promise<string | null> {
    const provider = await prisma.provider.findUnique({
      where: { slug: DEFAULT_PROVIDER_SLUG }
    });

    if (!provider) {
      logger.warn('[CertificationQueries] Provider não encontrado', { 
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
   * Obtém lista de modelos certificados e não expirados
   * Retorna deploymentId (string do provider) para compatibilidade
   *
   * @returns Array de modelIds (deploymentId string) certificados
   */
  async getCertifiedModels(): Promise<string[]> {
    logger.info('[CertificationQueries] Buscando modelos certificados');
    const now = new Date();
    
    const certifications = await prisma.modelCertification.findMany({
      where: {
        status: CertificationStatus.PASSED,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      include: {
        deployment: {
          select: {
            deploymentId: true
          }
        }
      }
    });
    
    // Extrair deploymentId (string do provider) para compatibilidade
    const modelIds = certifications
      .map(c => c.deployment?.deploymentId)
      .filter((id): id is string => id !== undefined && id !== null);
    
    logger.info('[CertificationQueries] Modelos certificados encontrados', {
      count: modelIds.length
    });
    
    return modelIds;
  }
  
  /**
   * Obtém lista de modelos que falharam na certificação
   * Retorna todos os modelos que não estão certificados (incluindo quality_warning)
   *
   * @returns Array de modelIds (deploymentId string) que falharam
   */
  async getFailedModels(): Promise<string[]> {
    logger.info('[CertificationQueries] Buscando modelos que falharam');
    
    const certifications = await prisma.modelCertification.findMany({
      where: {
        status: { not: CertificationStatus.PASSED }
      },
      include: {
        deployment: {
          select: {
            deploymentId: true
          }
        }
      },
      distinct: ['deploymentId']
    });
    
    const modelIds = certifications
      .map(c => c.deployment?.deploymentId)
      .filter((id): id is string => id !== undefined && id !== null);
    
    logger.info('[CertificationQueries] Modelos que falharam encontrados', {
      count: modelIds.length
    });
    
    return modelIds;
  }

  /**
   * Obtém lista de modelos realmente indisponíveis (não podem ser usados)
   * Retorna modelos com status 'failed' E categorias de erro críticas
   *
   * @returns Array de modelIds (deploymentId string) indisponíveis
   */
  async getUnavailableModels(): Promise<string[]> {
    logger.info('[CertificationQueries] Buscando modelos indisponíveis');
    
    const certs = await prisma.modelCertification.findMany({
      where: {
        status: { in: [CertificationStatus.FAILED, CertificationStatus.ERROR] },
        errorCategory: {
          in: ['UNAVAILABLE', 'PERMISSION_ERROR', 'AUTHENTICATION_ERROR', 'CONFIGURATION_ERROR', 'PROVISIONING_REQUIRED']
        }
      },
      include: {
        deployment: {
          select: {
            deploymentId: true
          }
        }
      },
      distinct: ['deploymentId']
    });
    
    const modelIds = certs
      .map(c => c.deployment?.deploymentId)
      .filter((id): id is string => id !== undefined && id !== null);
    
    logger.info('[CertificationQueries] Modelos indisponíveis encontrados', {
      count: modelIds.length
    });
    
    return modelIds;
  }

  /**
   * Obtém lista de TODOS os modelos com status 'failed'
   * Usado para exibir badge vermelho "❌ Indisponível" no frontend
   *
   * @returns Array de modelIds (deploymentId string) que falharam na certificação
   */
  async getAllFailedModels(): Promise<string[]> {
    logger.info('[CertificationQueries] Buscando TODOS os modelos com status failed');
    
    const certs = await prisma.modelCertification.findMany({
      where: {
        status: CertificationStatus.FAILED
      },
      include: {
        deployment: {
          select: {
            deploymentId: true
          }
        }
      },
      distinct: ['deploymentId']
    });
    
    const modelIds = certs
      .map(c => c.deployment?.deploymentId)
      .filter((id): id is string => id !== undefined && id !== null);
    
    logger.info('[CertificationQueries] Modelos failed encontrados', {
      count: modelIds.length
    });
    
    return modelIds;
  }

  /**
   * Obtém lista de modelos com warnings de qualidade
   * Nota: No schema v2, não há status QUALITY_WARNING, então buscamos
   * modelos com status PASSED mas com score baixo ou warnings
   *
   * @returns Array de modelIds (deploymentId string) com quality_warning
   */
  async getQualityWarningModels(): Promise<string[]> {
    logger.info('[CertificationQueries] Buscando modelos com warning de qualidade');
    
    // No schema v2, quality warning é indicado por score baixo ou rating baixo
    const certs = await prisma.modelCertification.findMany({
      where: {
        status: CertificationStatus.PASSED,
        OR: [
          { score: { lt: 70 } },
          { rating: { lt: 3.0 } }
        ]
      },
      include: {
        deployment: {
          select: {
            deploymentId: true
          }
        }
      },
      distinct: ['deploymentId']
    });
    
    const modelIds = certs
      .map(c => c.deployment?.deploymentId)
      .filter((id): id is string => id !== undefined && id !== null);
    
    logger.info('[CertificationQueries] Modelos com warning encontrados', {
      count: modelIds.length
    });
    
    return modelIds;
  }
  
  /**
   * Verifica se um modelo está certificado e não expirado
   * 
   * @param modelId - ID do modelo no provider (deploymentId string)
   * @param region - Região AWS (padrão: us-east-1)
   * @returns true se certificado e válido
   */
  async isCertified(modelId: string, region: string = DEFAULT_REGION): Promise<boolean> {
    const now = new Date();
    
    // Resolver modelId para deploymentId (UUID)
    const deploymentId = await this.resolveDeploymentId(modelId);
    if (!deploymentId) {
      logger.warn('[CertificationQueries] Deployment não encontrado', { modelId });
      return false;
    }
    
    const certification = await prisma.modelCertification.findUnique({
      where: { 
        deploymentId_region: { deploymentId, region } 
      }
    });
    
    if (!certification) {
      return false;
    }
    
    if (certification.status !== CertificationStatus.PASSED) {
      return false;
    }
    
    if (certification.expiresAt && certification.expiresAt <= now) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Obtém detalhes completos da certificação de um modelo
   *
   * @param modelId - ID do modelo no provider (deploymentId string)
   * @param region - Região AWS (padrão: us-east-1)
   * @returns Detalhes da certificação ou null se não encontrado
   */
  async getCertificationDetails(modelId: string, region: string = DEFAULT_REGION): Promise<{
    modelId: string;
    deploymentId: string;
    status: string;
    certifiedAt: Date | null;
    expiresAt: Date | null;
    lastTestedAt: Date;
    testsPassed: number;
    testsFailed: number;
    successRate: number;
    avgLatencyMs: number;
    lastError: string | null;
    isValid: boolean;
    daysUntilExpiration: number | null;
    errorCategory: string | null;
    errorSeverity: string | null;
    categorizedError?: CategorizedError;
  } | null> {
    // Resolver modelId para deploymentId (UUID)
    const deploymentUuid = await this.resolveDeploymentId(modelId);
    if (!deploymentUuid) {
      logger.warn('[CertificationQueries] Deployment não encontrado', { modelId });
      return null;
    }

    const cert = await prisma.modelCertification.findUnique({
      where: { 
        deploymentId_region: { deploymentId: deploymentUuid, region } 
      },
      include: {
        deployment: {
          select: {
            deploymentId: true
          }
        }
      }
    });
    
    if (!cert) {
      return null;
    }
    
    const now = new Date();
    const isValid = cert.status === CertificationStatus.PASSED &&
                    (!cert.expiresAt || cert.expiresAt > now);
    
    const daysUntilExpiration = cert.expiresAt
      ? Math.ceil((cert.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    // Reconstruir categorizedError se houver erro
    let categorizedError: CategorizedError | undefined;
    if (cert.errorCategory && cert.lastError) {
      categorizedError = categorizeError(cert.lastError);
    }
    
    return {
      modelId: cert.deployment?.deploymentId || modelId,
      deploymentId: cert.deploymentId,
      status: cert.status,
      certifiedAt: cert.certifiedAt,
      expiresAt: cert.expiresAt,
      lastTestedAt: cert.lastTestedAt || new Date(),
      testsPassed: cert.testsPassed,
      testsFailed: cert.testsFailed,
      successRate: cert.successRate,
      avgLatencyMs: cert.avgLatencyMs || 0,
      lastError: cert.lastError,
      isValid,
      daysUntilExpiration,
      errorCategory: cert.errorCategory,
      errorSeverity: cert.errorSeverity,
      categorizedError
    };
  }
}
