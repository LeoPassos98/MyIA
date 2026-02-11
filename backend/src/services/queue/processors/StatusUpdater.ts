// backend/src/services/queue/processors/StatusUpdater.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { PrismaClient } from '@prisma/client';
import { logger } from '../../../utils/logger';

const prisma = new PrismaClient();

/**
 * Resultado de certificação para atualização
 */
export interface CertificationUpdateResult {
  passed: boolean;
  score: number;
  rating: number | null;
  badge: string;
  testResults: unknown;
  duration: number;
}

/**
 * Erro de certificação para atualização
 */
export interface CertificationUpdateError {
  message: string;
  category: string;
  duration: number;
}

/**
 * StatusUpdater
 * 
 * Responsabilidade: Atualizar status de certificações no banco
 * Schema v2: 
 * - CertificationJob foi removido - usar Bull job data
 * - JobCertification foi removido - usar ModelCertification diretamente
 * - modelId_region → deploymentId_region
 * - Status: PENDING, RUNNING, PASSED, FAILED, ERROR, SKIPPED
 */
export class StatusUpdater {
  /**
   * Atualiza ModelCertification quando job inicia
   * Schema v2: Usa deploymentId em vez de modelId
   */
  async updateOnStart(
    _jobId: string,
    deploymentUUID: string,
    _apiModelId: string,
    region: string
  ): Promise<void> {
    logger.info(`▶️  Atualizando status para RUNNING: ${deploymentUUID} @ ${region}`);

    await prisma.modelCertification.upsert({
      where: {
        deploymentId_region: { deploymentId: deploymentUUID, region }
      },
      create: {
        deploymentId: deploymentUUID,
        region,
        status: 'RUNNING',
        startedAt: new Date()
      },
      update: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    logger.info(`✅ Status atualizado para RUNNING: ${deploymentUUID} @ ${region}`);
  }

  /**
   * Atualiza registros quando job completa com sucesso
   * Schema v2: Usa deploymentId em vez de modelId
   */
  async updateOnSuccess(
    _jobId: string,
    deploymentUUID: string,
    _apiModelId: string,
    region: string,
    result: CertificationUpdateResult
  ): Promise<void> {
    const updateTimestamp = new Date().toISOString();
    const status = result.passed ? 'PASSED' : 'FAILED';
    
    logger.info(`🔍 [DB-SAVE] Salvando resultado no banco`, {
      deploymentId: deploymentUUID,
      region,
      passed: result.passed,
      score: result.score,
      rating: result.rating,
      badge: result.badge,
      duration: result.duration,
      timestamp: updateTimestamp
    });

    await prisma.modelCertification.upsert({
      where: {
        deploymentId_region: { deploymentId: deploymentUUID, region }
      },
      create: {
        deploymentId: deploymentUUID,
        region,
        status,
        passed: result.passed,
        score: result.score,
        rating: result.rating,
        badge: result.badge,
        testResults: result.testResults as object,
        completedAt: new Date(),
        duration: result.duration,
        certifiedAt: result.passed ? new Date() : null
      },
      update: {
        status,
        passed: result.passed,
        score: result.score,
        // NÃO sobrescrever badge e rating - já salvos corretamente
        // pelo certification.service.ts via RatingCalculator
        testResults: result.testResults as object,
        completedAt: new Date(),
        duration: result.duration,
        certifiedAt: result.passed ? new Date() : null
      }
    });

    logger.info(`✅ [DB-SAVE] Resultado salvo com sucesso no banco`, {
      deploymentId: deploymentUUID,
      region,
      status,
      passed: result.passed,
      score: result.score,
      rating: result.rating,
      badge: result.badge,
      duration: result.duration,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Atualiza registros quando job falha
   * Schema v2: Usa deploymentId em vez de modelId
   */
  async updateOnFailure(
    _jobId: string,
    deploymentUUID: string,
    _apiModelId: string,
    region: string,
    error: CertificationUpdateError
  ): Promise<void> {
    logger.error(`❌ Atualizando status para ERROR: ${deploymentUUID} @ ${region}`, {
      errorMessage: error.message,
      errorCategory: error.category,
      duration: error.duration
    });

    await prisma.modelCertification.upsert({
      where: {
        deploymentId_region: { deploymentId: deploymentUUID, region }
      },
      create: {
        deploymentId: deploymentUUID,
        region,
        status: 'ERROR',
        passed: false,
        errorMessage: error.message,
        errorCategory: error.category,
        completedAt: new Date(),
        duration: error.duration
      },
      update: {
        status: 'ERROR',
        passed: false,
        errorMessage: error.message,
        errorCategory: error.category,
        completedAt: new Date(),
        duration: error.duration
      }
    });

    logger.info(`✅ Status atualizado para ERROR: ${deploymentUUID} @ ${region}`);
  }

  /**
   * Atualiza contadores do job
   * Schema v2: CertificationJob foi removido - esta função agora é no-op
   * Os contadores são gerenciados pelo Bull queue diretamente
   */
  async updateJobCounters(
    _jobId: string,
    increment: {
      processed: number;
      success?: number;
      failure?: number;
    }
  ): Promise<void> {
    // Schema v2: CertificationJob foi removido
    // Os contadores são gerenciados pelo Bull queue diretamente
    // Esta função é mantida para compatibilidade com código existente
    logger.debug(`📊 Contadores do job (no-op no schema v2)`, {
      jobId: _jobId,
      increment
    });
  }
}
