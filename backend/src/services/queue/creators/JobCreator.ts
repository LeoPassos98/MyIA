// backend/src/services/queue/creators/JobCreator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { PrismaClient, Prisma } from '@prisma/client';
import { QueueService } from '../QueueService';
import { logger } from '../../../utils/logger';
import { config } from '../../../config/env';
import { CertificationJobData } from '../../../types/certification-queue';

const prisma = new PrismaClient();

/**
 * JobCreator
 * 
 * Responsabilidade: Criar registros de jobs no banco e adicionar à fila Bull
 * - Cria job único no banco e na fila
 * - Cria job em lote (múltiplos modelos x múltiplas regiões)
 * - Cria registro de certificação no banco (upsert)
 */
export class JobCreator {
  constructor(
    private queueService: QueueService,
    private queueName: string
  ) {}

  /**
   * Cria job único no banco e na fila
   */
  async createSingleJob(
    modelId: string,
    region: string,
    createdBy?: string
  ): Promise<{ jobId: string; bullJobId: string }> {
    logger.info(`📝 Criando job de certificação: ${modelId} @ ${region}`);

    // 1. Criar registro no banco
    const certificationJob = await prisma.certificationJob.create({
      data: {
        type: 'SINGLE_MODEL',
        regions: [region],
        modelIds: [modelId],
        status: 'PENDING',
        totalModels: 1,
        createdBy
      }
    });

    // 2. Criar certificação no banco
    const certification = await this.createCertificationRecord(modelId, region, createdBy);

    // 3. Adicionar job à fila Bull
    const bullJob = await this.queueService.addJob<CertificationJobData>(
      this.queueName,
      {
        jobId: certificationJob.id,
        modelId,
        region,
        createdBy
      },
      {
        jobId: certificationJob.id,
        attempts: parseInt(config.certificationMaxRetries as string, 10),
        timeout: parseInt(config.certificationTimeout as string, 10)
      }
    );

    // 4. Atualizar com bullJobId
    await prisma.certificationJob.update({
      where: { id: certificationJob.id },
      data: {
        bullJobId: bullJob.id?.toString(),
        status: 'QUEUED'
      }
    });

    await prisma.modelCertification.update({
      where: { id: certification },
      data: {
        jobId: bullJob.id?.toString(),
        status: 'QUEUED'
      }
    });

    logger.info(`✅ Job criado: ${certificationJob.id} (Bull: ${bullJob.id})`);

    return {
      jobId: certificationJob.id,
      bullJobId: bullJob.id?.toString() || ''
    };
  }

  /**
   * Cria job em lote (múltiplos modelos x múltiplas regiões)
   */
  async createBatchJob(
    modelIds: string[],
    regions: string[],
    createdBy?: string
  ): Promise<{ jobId: string; totalJobs: number }> {
    logger.info(`📝 Criando job de certificação em lote: ${modelIds.length} modelos x ${regions.length} regiões`);

    // 1. Criar registro do job PAI no banco
    const certificationJob = await prisma.certificationJob.create({
      data: {
        type: 'MULTIPLE_MODELS',
        regions,
        modelIds,
        status: 'PENDING',
        totalModels: modelIds.length * regions.length,
        createdBy
      }
    });

    // 2. Criar jobs individuais no Bull (todos vinculados ao job PAI)
    let jobCount = 0;
    for (const modelId of modelIds) {
      for (const region of regions) {
        // Criar ou atualizar certificação no banco
        const certificationId = await this.createCertificationRecord(modelId, region, createdBy);

        // Adicionar job à fila Bull (vinculado ao job PAI)
        const bullJob = await this.queueService.addJob<CertificationJobData>(
          this.queueName,
          {
            jobId: certificationJob.id, // Job PAI
            modelId,
            region,
            createdBy
          },
          {
            jobId: `${certificationJob.id}-${certificationId}`, // ID único para o Bull
            attempts: parseInt(config.certificationMaxRetries as string, 10),
            timeout: parseInt(config.certificationTimeout as string, 10)
          }
        );

        await prisma.modelCertification.update({
          where: { id: certificationId },
          data: {
            jobId: bullJob.id?.toString(),
            status: 'QUEUED'
          }
        });

        jobCount++;
      }
    }

    // 3. Atualizar status do job PAI
    await prisma.certificationJob.update({
      where: { id: certificationJob.id },
      data: {
        status: 'QUEUED',
        startedAt: new Date()
      }
    });

    logger.info(`✅ Job em lote criado: ${certificationJob.id} (${jobCount} jobs na fila)`);

    return {
      jobId: certificationJob.id,
      totalJobs: jobCount
    };
  }

  /**
   * Cria registro de certificação no banco (upsert)
   * @returns ID da certificação criada/atualizada
   */
  private async createCertificationRecord(
    modelId: string,
    region: string,
    createdBy?: string
  ): Promise<string> {
    const certification = await prisma.modelCertification.upsert({
      where: {
        modelId_region: { modelId, region }
      },
      create: {
        modelId,
        region,
        status: 'PENDING',
        createdBy
      },
      update: {
        status: 'PENDING',
        passed: null,
        score: null,
        rating: null,
        testResults: Prisma.JsonNull,
        errorMessage: null,
        errorCategory: null,
        startedAt: null,
        completedAt: null,
        duration: null
      }
    });

    return certification.id;
  }
}
