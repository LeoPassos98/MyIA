// backend/src/services/queue/creators/JobCreator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { QueueService } from '../QueueService';
import { logger } from '../../../utils/logger';
import { config } from '../../../config/env';
import { CertificationJobData } from '../../../types/certification-queue';

const prisma = new PrismaClient();

/**
 * JobCreator
 * 
 * Responsabilidade: Criar registros de jobs no banco e adicionar à fila Bull
 * Schema v2: CertificationJob foi removido, usar ModelCertification diretamente
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
   * Schema v2: Usa ModelCertification diretamente (CertificationJob removido)
   */
  async createSingleJob(
    deploymentId: string,
    region: string,
    createdBy?: string
  ): Promise<{ jobId: string; bullJobId: string }> {
    logger.info(`📝 Criando job de certificação: ${deploymentId} @ ${region}`);

    // Gerar ID único para o job (substitui CertificationJob.id)
    const jobId = uuidv4();

    // 1. Criar certificação no banco
    const certificationId = await this.createCertificationRecord(deploymentId, region, createdBy);

    // 2. Adicionar job à fila Bull
    const bullJob = await this.queueService.addJob<CertificationJobData>(
      this.queueName,
      {
        jobId,
        modelId: deploymentId, // Mantém compatibilidade com interface existente
        deploymentId, // Novo campo para schema v2
        region,
        createdBy
      },
      {
        jobId,
        attempts: parseInt(config.certificationMaxRetries as string, 10),
        timeout: parseInt(config.certificationTimeout as string, 10)
      }
    );

    // 3. Atualizar certificação com bullJobId
    await prisma.modelCertification.update({
      where: { id: certificationId },
      data: {
        jobId: bullJob.id?.toString(),
        status: 'PENDING'
      }
    });

    logger.info(`✅ Job criado: ${jobId} (Bull: ${bullJob.id})`);

    return {
      jobId,
      bullJobId: bullJob.id?.toString() || ''
    };
  }

  /**
   * Cria job em lote (múltiplos modelos x múltiplas regiões)
   * Schema v2: Usa ModelCertification diretamente (CertificationJob removido)
   */
  async createBatchJob(
    deploymentIds: string[],
    regions: string[],
    createdBy?: string
  ): Promise<{ jobId: string; totalJobs: number }> {
    logger.info(`📝 Criando job de certificação em lote: ${deploymentIds.length} modelos x ${regions.length} regiões`);

    // Gerar ID único para o job PAI (substitui CertificationJob.id)
    const batchJobId = uuidv4();

    // Criar jobs individuais no Bull
    let jobCount = 0;
    for (const deploymentId of deploymentIds) {
      for (const region of regions) {
        // Criar ou atualizar certificação no banco
        const certificationId = await this.createCertificationRecord(deploymentId, region, createdBy);

        // Adicionar job à fila Bull (vinculado ao job PAI)
        const bullJob = await this.queueService.addJob<CertificationJobData>(
          this.queueName,
          {
            jobId: batchJobId, // Job PAI
            modelId: deploymentId, // Mantém compatibilidade
            deploymentId, // Novo campo para schema v2
            region,
            createdBy
          },
          {
            jobId: `${batchJobId}-${certificationId}`, // ID único para o Bull
            attempts: parseInt(config.certificationMaxRetries as string, 10),
            timeout: parseInt(config.certificationTimeout as string, 10)
          }
        );

        await prisma.modelCertification.update({
          where: { id: certificationId },
          data: {
            jobId: bullJob.id?.toString(),
            status: 'PENDING'
          }
        });

        jobCount++;
      }
    }

    logger.info(`✅ Job em lote criado: ${batchJobId} (${jobCount} jobs na fila)`);

    return {
      jobId: batchJobId,
      totalJobs: jobCount
    };
  }

  /**
   * Cria registro de certificação no banco (upsert)
   * Schema v2: Usa deploymentId em vez de modelId
   * @returns ID da certificação criada/atualizada
   */
  private async createCertificationRecord(
    deploymentId: string,
    region: string,
    createdBy?: string
  ): Promise<string> {
    const certification = await prisma.modelCertification.upsert({
      where: {
        deploymentId_region: { deploymentId, region }
      },
      create: {
        deploymentId,
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
