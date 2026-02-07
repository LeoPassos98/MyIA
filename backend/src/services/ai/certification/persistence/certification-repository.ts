// backend/src/services/ai/certification/persistence/certification-repository.ts
// Standards: docs/STANDARDS.md

import { Prisma } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';
import { ModelCertificationStatus } from '../types';
import { RatingCalculator } from '../../rating/rating-calculator';
import { ModelMetrics } from '../../../../types/model-rating';
import { logger } from '../../../../utils/logger';

/**
 * Gerencia persistência de certificações no banco de dados
 * 
 * Responsabilidades:
 * - Calcular rating usando RatingCalculator
 * - Preparar dados para salvamento
 * - Executar upsert no banco
 * - Calcular expiresAt baseado em status
 * 
 * @example
 * const repository = new CertificationRepository();
 * await repository.save({
 *   modelId: 'model-id',
 *   region: 'us-east-1',
 *   vendor: 'anthropic',
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
   * @param data - Dados da certificação
   * @returns Certificação salva
   */
  async save(data: {
    modelId: string;
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
    testResults: any[];
  }) {
    logger.info('[CertificationRepository] Salvando certificação', {
      modelId: data.modelId,
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
    
    // Preparar dados para salvar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      vendor: data.vendor,
      status: data.status,
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
    
    // Executar upsert
    const savedCertification = await prisma.modelCertification.upsert({
      where: { 
        modelId_region: { 
          modelId: data.modelId, 
          region: data.region 
        } 
      },
      update: updateData,
      create: {
        modelId: data.modelId,
        region: data.region,
        ...updateData
      }
    });
    
    logger.info('[CertificationRepository] Certificação salva com sucesso', {
      id: savedCertification.id,
      modelId: savedCertification.modelId,
      status: savedCertification.status
    });
    
    return savedCertification;
  }
}
