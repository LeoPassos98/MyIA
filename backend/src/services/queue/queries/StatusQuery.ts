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
 * - Obtém status completo de um job
 * - Obtém estatísticas da fila (Bull + Banco)
 * - Cancela um job
 */
export class StatusQuery {
  constructor(
    private queueService: QueueService,
    private queueName: string
  ) {}

  /**
   * Obtém status completo de um job
   */
  async getJobStatus(jobId: string) {
    const job = await prisma.certificationJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return null;
    }

    // Buscar certificações relacionadas (sem FK para AIModel)
    const certifications = await prisma.modelCertification.findMany({
      where: {
        modelId: { in: job.modelIds },
        region: { in: job.regions }
      },
      orderBy: [
        { status: 'asc' }, // PENDING primeiro, depois COMPLETED
        { createdAt: 'asc' }
      ]
    });

    // Mapear errorMessage para error para compatibilidade com frontend
    const certificationsWithError = certifications.map(cert => ({
      ...cert,
      error: cert.errorMessage // Adiciona campo 'error' para compatibilidade
    }));

    return {
      ...job,
      certifications: certificationsWithError
    };
  }

  /**
   * Obtém estatísticas da fila (Bull + Banco)
   */
  async getQueueStats() {
    const counts = await this.queueService.getQueueCounts(this.queueName);

    const dbStats = await prisma.certificationJob.groupBy({
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
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = await prisma.certificationJob.findUnique({
      where: { id: jobId }
    });

    if (!job || !job.bullJobId) {
      throw new Error('Job not found or no Bull job ID');
    }

    // Cancelar job no Bull
    const queue = this.queueService.getQueue({ name: this.queueName });
    const bullJob = await queue.getJob(job.bullJobId);
    if (bullJob) {
      await bullJob.remove();
    }

    // Atualizar status
    await prisma.certificationJob.update({
      where: { id: jobId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date()
      }
    });

    logger.info(`🚫 Job cancelado: ${jobId}`);
  }
}
