// backend/src/services/ai/certification/persistence/certification-repository.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Prisma, CertificationStatus } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';
import { ModelCertificationStatus } from '../types';
import { RatingCalculator } from '../../rating/rating-calculator';
import { ModelMetrics } from '../../../../types/model-rating';
import { logger } from '../../../../utils/logger';

/**
 * Mapeamento de ModelCertificationStatus (local) para CertificationStatus (Prisma)
 * 
 * O schema v2 usa CertificationStatus do Prisma com valores diferentes:
 * - PENDING, RUNNING, PASSED, FAILED, ERROR, SKIPPED
 * 
 * Enquanto o código usa ModelCertificationStatus:
 * - PENDING, QUEUED, PROCESSING, COMPLETED, CERTIFIED, FAILED, CANCELLED, QUALITY_WARNING
 */
function mapToPrismaStatus(status: ModelCertificationStatus): CertificationStatus {
  switch (status) {
    case ModelCertificationStatus.PENDING:
      return CertificationStatus.PENDING;
    case ModelCertificationStatus.QUEUED:
      return CertificationStatus.PENDING;
    case ModelCertificationStatus.PROCESSING:
      return CertificationStatus.RUNNING;
    case ModelCertificationStatus.COMPLETED:
      return CertificationStatus.PASSED;
    case ModelCertificationStatus.CERTIFIED:
      return CertificationStatus.PASSED;
    case ModelCertificationStatus.FAILED:
      return CertificationStatus.FAILED;
    case ModelCertificationStatus.CANCELLED:
      return CertificationStatus.SKIPPED;
    case ModelCertificationStatus.QUALITY_WARNING:
      return CertificationStatus.PASSED; // Quality warning ainda é PASSED, mas com score baixo
    default:
      return CertificationStatus.PENDING;
  }
}

/**
 * Dados para salvar certificação
 * 
 * Transição v1 → v2:
 * - modelId: string do provider (mantido para compatibilidade)
 * - deploymentId: UUID do deployment (v2) ou null (fallback)
 */
interface SaveCertificationData {
  modelId: string;
  deploymentId: string | null;  // UUID do deployment (v2) ou null (fallback)
  region: string;
  vendor: string;
  status: ModelCertificationStatus;
  testsPassed: number;
  testsFailed: number;
  successRate: number;
  avgLatencyMs: number;
  lastError: string | null;
  failureReasons: Array<{
    testId: string;
    testName: string;
    error: string;
  }>;
  errorCategory: string | null;
  errorSeverity: string | null;
  isCertified: boolean;
  testResults: unknown[];
}

/**
 * Gerencia persistência de certificações no banco de dados
 * 
 * Responsabilidades:
 * - Calcular rating usando RatingCalculator
 * - Preparar dados para salvamento
 * - Executar upsert no banco
 * - Calcular expiresAt baseado em status
 * 
 * Transição v1 → v2:
 * - Se deploymentId (UUID) fornecido: usa FK para ModelDeployment
 * - Se deploymentId null: usa modelId string (fallback durante transição)
 * 
 * @example
 * const repository = new CertificationRepository();
 * await repository.save({
 *   modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
 *   deploymentId: 'uuid-do-deployment',  // ou null para fallback
 *   region: 'us-east-1',
 *   vendor: 'Anthropic',
 *   status: ModelCertificationStatus.CERTIFIED,
 *   testsPassed: 8,
 *   testsFailed: 2,
 *   successRate: 80,
 *   avgLatencyMs: 1500,
 *   lastError: null,
 *   failureReasons: [],
 *   errorCategory: null,
 *   errorSeverity: null,
 *   isCertified: true,
 *   testResults: []
 * });
 */
export class CertificationRepository {
  private ratingCalculator: RatingCalculator;
  
  constructor() {
    this.ratingCalculator = new RatingCalculator();
  }
  
  /**
   * Salva certificação no banco (upsert)
   * 
   * Estratégia de persistência:
   * - Se deploymentId fornecido: usa FK (schema v2)
   * - Se deploymentId null: cria registro sem FK (compatibilidade)
   * 
   * @param data - Dados da certificação
   * @returns Certificação salva
   */
  async save(data: SaveCertificationData) {
    logger.info('[CertificationRepository] Salvando certificação', {
      modelId: data.modelId,
      deploymentId: data.deploymentId || '(fallback)',
      region: data.region,
      status: data.status,
      isCertified: data.isCertified
    });
    
    // Calcular rating usando RatingCalculator
    const aggregatedMetrics: ModelMetrics = {
      testsPassed: data.testsPassed,
      totalTests: data.testsPassed + data.testsFailed,
      successRate: data.successRate,
      averageRetries: 0, // Será calculado pelo TestRunner
      averageLatency: data.avgLatencyMs,
      errorCount: data.failureReasons.length
    };
    
    const ratingResult = this.ratingCalculator.calculateRating(data.modelId, aggregatedMetrics);
    
    logger.info('[CertificationRepository] Rating calculado', {
      modelId: data.modelId,
      rating: ratingResult.rating,
      badge: ratingResult.badge
    });
    
    // Calcular expiresAt
    const now = new Date();
    const expiresAt = data.isCertified
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      : null;
    
    // Preparar dados comuns para salvar
    // Mapear status local para status do Prisma
    const prismaStatus = mapToPrismaStatus(data.status);
    
    const commonData = {
      status: prismaStatus,
      certifiedAt: data.isCertified ? now : null,
      expiresAt,
      certifiedBy: 'system',
      lastTestedAt: now,
      testsPassed: data.testsPassed,
      testsFailed: data.testsFailed,
      successRate: data.successRate,
      avgLatencyMs: data.avgLatencyMs,
      lastError: data.lastError,
      failureReasons: data.failureReasons.length > 0 ? data.failureReasons : Prisma.JsonNull,
      errorCategory: data.errorCategory,
      errorSeverity: data.errorSeverity,
      // Campos de rating
      rating: ratingResult.rating,
      badge: ratingResult.badge,
      metrics: ratingResult.metrics,
      scores: ratingResult.scores,
      ratingUpdatedAt: now,
      updatedAt: now
    };

    // Estratégia de persistência baseada em deploymentId
    if (data.deploymentId) {
      // Schema v2: usar FK para deployment
      return this.saveWithDeploymentFK(data.deploymentId, data.region, commonData);
    } else {
      // Fallback: criar registro temporário (será migrado posteriormente)
      logger.warn('[CertificationRepository] Salvando sem FK (fallback)', {
        modelId: data.modelId,
        region: data.region
      });
      return this.saveWithoutDeploymentFK(data.modelId, data.region, commonData);
    }
  }

  /**
   * Salva certificação usando FK para deployment (schema v2)
   */
  private async saveWithDeploymentFK(
    deploymentId: string,
    region: string,
    commonData: Record<string, unknown>
  ) {
    const savedCertification = await prisma.modelCertification.upsert({
      where: { 
        deploymentId_region: { 
          deploymentId,
          region 
        } 
      },
      update: commonData,
      create: {
        deploymentId,
        region,
        ...commonData
      }
    });
    
    logger.info('[CertificationRepository] Certificação salva com FK (v2)', {
      id: savedCertification.id,
      deploymentId: savedCertification.deploymentId,
      status: savedCertification.status
    });
    
    return savedCertification;
  }

  /**
   * Salva certificação sem FK (fallback durante transição)
   * 
   * NOTA: Este método é temporário e será removido após migração completa.
   * Registros criados aqui precisarão ser migrados para usar FK.
   */
  private async saveWithoutDeploymentFK(
    modelId: string,
    region: string,
    commonData: Record<string, unknown>
  ) {
    // Buscar se já existe uma certificação para este modelo/região
    // usando busca por deploymentId que contenha o modelId
    const existing = await prisma.modelCertification.findFirst({
      where: {
        region,
        deployment: {
          deploymentId: modelId
        }
      }
    });

    if (existing) {
      // Atualizar registro existente
      const savedCertification = await prisma.modelCertification.update({
        where: { id: existing.id },
        data: commonData
      });

      logger.info('[CertificationRepository] Certificação atualizada (fallback)', {
        id: savedCertification.id,
        status: savedCertification.status
      });

      return savedCertification;
    }

    // Não existe - não podemos criar sem deploymentId válido
    // Logar warning e retornar null
    logger.error('[CertificationRepository] Não é possível criar certificação sem deploymentId válido', {
      modelId,
      region
    });
    
    throw new Error(
      `Cannot create certification without valid deploymentId. ` +
      `Model "${modelId}" needs to be added to the database first.`
    );
  }
}
