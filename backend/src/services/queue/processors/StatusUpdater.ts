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
  testResults: any;
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
 * Responsabilidade: Atualizar status de jobs e certificações no banco
 * - Atualiza JobCertification e ModelCertification quando job inicia
 * - Atualiza registros quando job completa com sucesso
 * - Atualiza registros quando job falha
 * - Atualiza contadores do CertificationJob (job PAI)
 */
export class StatusUpdater {
  /**
   * Atualiza JobCertification e ModelCertification quando job inicia
   */
  async updateOnStart(
    jobId: string,
    modelUUID: string,
    apiModelId: string,
    region: string
  ): Promise<void> {
    logger.info(`▶️  Atualizando status para PROCESSING: ${apiModelId} @ ${region}`);

    await Promise.all([
      prisma.jobCertification.upsert({
        where: {
          jobId_modelId_region: { jobId, modelId: modelUUID, region }
        },
        create: {
          jobId,
          modelId: modelUUID,
          region,
          status: 'PROCESSING',
          startedAt: new Date()
        },
        update: {
          status: 'PROCESSING',
          startedAt: new Date(),
          completedAt: null,
          duration: null,
          error: null,
          details: undefined
        }
      }),
      prisma.modelCertification.upsert({
        where: {
          modelId_region: { modelId: apiModelId, region }
        },
        create: {
          modelId: apiModelId,
          region,
          status: 'PROCESSING',
          startedAt: new Date()
        },
        update: {
          status: 'PROCESSING',
          startedAt: new Date()
        }
      })
    ]);

    logger.info(`✅ Status atualizado para PROCESSING: ${apiModelId} @ ${region}`);
  }

  /**
   * Atualiza registros quando job completa com sucesso
   */
  async updateOnSuccess(
    jobId: string,
    modelUUID: string,
    apiModelId: string,
    region: string,
    result: CertificationUpdateResult
  ): Promise<void> {
    const updateTimestamp = new Date().toISOString();
    
    logger.info(`🔍 [DB-SAVE] Salvando resultado no banco`, {
      modelId: apiModelId,
      region,
      passed: result.passed,
      score: result.score,
      rating: result.rating,
      badge: result.badge,
      duration: result.duration,
      timestamp: updateTimestamp
    });

    // Buscar JobCertification para obter o ID
    const jobCert = await prisma.jobCertification.findUnique({
      where: {
        jobId_modelId_region: { jobId, modelId: modelUUID, region }
      },
      select: { id: true }
    });

    if (!jobCert) {
      throw new Error(`JobCertification não encontrado: jobId=${jobId}, modelId=${modelUUID}, region=${region}`);
    }

    await Promise.all([
      prisma.jobCertification.update({
        where: { id: jobCert.id },
        data: {
          status: result.passed ? 'PASSED' : 'FAILED',
          completedAt: new Date(),
          duration: result.duration,
          details: {
            timestamp: new Date().toISOString(),
            score: result.score,
            rating: result.rating,
            badge: result.badge,
            testResults: result.testResults
          } as any
        }
      }),
      prisma.modelCertification.upsert({
        where: {
          modelId_region: { modelId: apiModelId, region }
        },
        create: {
          modelId: apiModelId,
          region,
          status: result.passed ? 'CERTIFIED' : 'FAILED',
          passed: result.passed,
          score: result.score,
          rating: result.rating,
          badge: result.badge,
          testResults: result.testResults as any,
          completedAt: new Date(),
          duration: result.duration
        },
        update: {
          status: result.passed ? 'CERTIFIED' : 'FAILED',
          passed: result.passed,
          score: result.score,
          // NÃO sobrescrever badge e rating - já salvos corretamente
          // pelo certification.service.ts via RatingCalculator
          testResults: result.testResults as any,
          completedAt: new Date(),
          duration: result.duration
        }
      })
    ]);

    logger.info(`✅ [DB-SAVE] Resultado salvo com sucesso no banco`, {
      modelId: apiModelId,
      region,
      status: result.passed ? 'CERTIFIED' : 'FAILED',
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
   */
  async updateOnFailure(
    jobId: string,
    modelUUID: string,
    apiModelId: string,
    region: string,
    error: CertificationUpdateError
  ): Promise<void> {
    logger.error(`❌ Atualizando status para FAILED: ${apiModelId} @ ${region}`, {
      errorMessage: error.message,
      errorCategory: error.category,
      duration: error.duration
    });

    await Promise.all([
      prisma.jobCertification.updateMany({
        where: {
          jobId,
          modelId: modelUUID,
          region,
          status: 'PROCESSING'
        },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration: error.duration,
          error: error.message
        }
      }),
      prisma.modelCertification.upsert({
        where: {
          modelId_region: { modelId: apiModelId, region }
        },
        create: {
          modelId: apiModelId,
          region,
          status: 'FAILED',
          passed: false,
          errorMessage: error.message,
          errorCategory: error.category,
          completedAt: new Date(),
          duration: error.duration
        },
        update: {
          status: 'FAILED',
          passed: false,
          errorMessage: error.message,
          errorCategory: error.category,
          completedAt: new Date(),
          duration: error.duration
        }
      })
    ]);

    logger.info(`✅ Status atualizado para FAILED: ${apiModelId} @ ${region}`);
  }

  /**
   * Atualiza contadores do CertificationJob (job PAI)
   */
  async updateJobCounters(
    jobId: string,
    increment: {
      processed: number;
      success?: number;
      failure?: number;
    }
  ): Promise<void> {
    await prisma.certificationJob.update({
      where: { id: jobId },
      data: {
        processedModels: { increment: increment.processed },
        successCount: increment.success ? { increment: increment.success } : undefined,
        failureCount: increment.failure ? { increment: increment.failure } : undefined
      }
    });

    logger.info(`✅ Contadores do job atualizados: ${jobId}`, increment);
  }
}
