// backend/src/services/queue/queries/StatusQuery.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { PrismaClient } from '@prisma/client';
import { QueueService } from '../QueueService';
import { logger } from '../../../utils/logger';

const prisma = new PrismaClient();

/**
 * StatusQuery
 * 
 * Responsabilidade: Consultar status de jobs e estatísticas
 * Schema v2: CertificationJob foi removido - usar Bull queue + ModelCertification
 * - Obtém status de certificações por jobId (Bull job ID)
 * - Obtém estatísticas da fila (Bull + Banco)
 * - Cancela um job
 */
export class StatusQuery {
  constructor(
    private queueService: QueueService,
    private queueName: string
  ) {}

  /**
   * Obtém status de certificações por jobId
   * Schema v2: CertificationJob foi removido - buscar por jobId em ModelCertification
   */
  async getJobStatus(jobId: string) {
    // Buscar certificações que têm este jobId
    const certifications = await prisma.modelCertification.findMany({
      where: {
        jobId: jobId
      },
      include: {
        deployment: {
          include: {
            baseModel: true,
            provider: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (certifications.length === 0) {
      // Tentar buscar pelo Bull job
      const queue = this.queueService.getQueue({ name: this.queueName });
      const bullJob = await queue.getJob(jobId);
      
      if (!bullJob) {
        return null;
      }

      // Retornar informações do Bull job
      return {
        id: jobId,
        status: await bullJob.getState(),
        data: bullJob.data,
        progress: bullJob.progress(),
        certifications: []
      };
    }

    // Mapear errorMessage para error para compatibilidade com frontend
    const certificationsWithError = certifications.map(cert => ({
      ...cert,
      error: cert.errorMessage,
      modelId: cert.deployment?.deploymentId // Compatibilidade com código antigo
    }));

    // Calcular estatísticas
    const totalModels = certifications.length;
    const processedModels = certifications.filter(c => 
      c.status === 'PASSED' || c.status === 'FAILED' || c.status === 'ERROR'
    ).length;
    const successCount = certifications.filter(c => c.status === 'PASSED').length;
    const failureCount = certifications.filter(c => 
      c.status === 'FAILED' || c.status === 'ERROR'
    ).length;

    // Determinar status geral
    let status = 'PENDING';
    if (processedModels === totalModels) {
      status = failureCount > 0 ? 'FAILED' : 'PASSED';
    } else if (processedModels > 0) {
      status = 'RUNNING';
    }

    return {
      id: jobId,
      status,
      totalModels,
      processedModels,
      successCount,
      failureCount,
      certifications: certificationsWithError
    };
  }

  /**
   * Obtém estatísticas da fila (Bull + Banco)
   * Schema v2: Usa ModelCertification em vez de CertificationJob
   */
  async getQueueStats() {
    const counts = await this.queueService.getQueueCounts(this.queueName);

    const dbStats = await prisma.modelCertification.groupBy({
      by: ['status'],
      _count: true
    });

    return {
      queue: counts,
      database: dbStats
    };
  }

  /**
   * Cancela um job
   * Schema v2: Cancela no Bull e atualiza ModelCertification
   */
  async cancelJob(jobId: string): Promise<void> {
    // Buscar job no Bull
    const queue = this.queueService.getQueue({ name: this.queueName });
    const bullJob = await queue.getJob(jobId);
    
    if (bullJob) {
      await bullJob.remove();
    }

    // Atualizar certificações relacionadas
    await prisma.modelCertification.updateMany({
      where: {
        jobId: jobId,
        status: { in: ['PENDING', 'RUNNING'] }
      },
      data: {
        status: 'SKIPPED',
        completedAt: new Date()
      }
    });

    logger.info(`🚫 Job cancelado: ${jobId}`);
  }
}
