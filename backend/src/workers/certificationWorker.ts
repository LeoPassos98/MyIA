// backend/src/workers/certificationWorker.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Job } from 'bull';
import { queueService } from '../services/queue/QueueService';
import { certificationQueueService } from '../services/queue/CertificationQueueService';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { prisma } from '../lib/prisma';

class CertificationWorker {
  private queue: any;
  private isRunning: boolean = false;
  private queueName: string;
  private concurrency: number;

  constructor() {
    this.queueName = config.certificationQueueName as string;
    this.concurrency = parseInt(config.certificationConcurrency as string, 10);

    this.queue = queueService.getQueue({
      name: this.queueName,
      concurrency: this.concurrency
    });

    logger.info('🔧 CertificationWorker initialized', {
      queueName: this.queueName,
      concurrency: this.concurrency
    });
  }

  /**
   * Inicia o worker
   */
  public start() {
    if (this.isRunning) {
      logger.warn('Worker already running');
      return;
    }

    logger.info('▶️  Starting CertificationWorker...', {
      queueName: this.queueName,
      concurrency: this.concurrency
    });

    // Registrar processador
    this.queue.process(async (job: Job) => {
      return this.processJob(job);
    });

    // Event handlers
    this.queue.on('completed', async (job: Job, result: any) => {
      logger.info(`✅ Job ${job.id} completed`, { 
        jobId: job.id,
        modelId: job.data.modelId,
        region: job.data.region,
        result 
      });
      
      // Atualizar CertificationJob no banco
      await this.updateJobOnCompleted(job, result);
    });

    this.queue.on('failed', async (job: Job, err: Error) => {
      logger.error(`❌ Job ${job.id} failed`, { 
        jobId: job.id,
        modelId: job.data.modelId,
        region: job.data.region,
        error: err.message,
        stack: err.stack
      });
      
      // Atualizar CertificationJob no banco
      await this.updateJobOnFailed(job, err);
    });

    this.queue.on('stalled', (job: Job) => {
      logger.warn(`⚠️  Job ${job.id} stalled`, {
        jobId: job.id,
        modelId: job.data.modelId,
        region: job.data.region
      });
    });

    this.queue.on('error', (error: Error) => {
      logger.error('❌ Queue error', { 
        error: error.message,
        stack: error.stack
      });
    });

    this.queue.on('active', async (job: Job) => {
      logger.info(`▶️  Job ${job.id} started processing`, {
        jobId: job.id,
        modelId: job.data.modelId,
        region: job.data.region
      });
      
      // Atualizar CertificationJob no banco
      await this.updateJobOnActive(job);
    });

    this.isRunning = true;
    logger.info('✅ CertificationWorker started successfully', {
      queueName: this.queueName,
      concurrency: this.concurrency
    });
  }

  /**
   * Para o worker
   */
  public async stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('⏹️  Stopping CertificationWorker...');
    
    try {
      await this.queue.close();
      this.isRunning = false;
      logger.info('✅ CertificationWorker stopped');
    } catch (error: any) {
      logger.error('❌ Error stopping worker', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Processa um job
   */
  private async processJob(job: Job): Promise<any> {
    logger.info(`▶️  Processing job ${job.id}`, { 
      jobId: job.id,
      modelId: job.data.modelId,
      region: job.data.region,
      data: job.data 
    });

    try {
      // Delegar para CertificationQueueService
      const result = await certificationQueueService.processCertification(job);
      
      logger.info(`✅ Job ${job.id} processed successfully`, {
        jobId: job.id,
        modelId: result.modelId,
        region: result.region,
        passed: result.passed,
        score: result.score,
        rating: result.rating,
        duration: result.duration
      });

      return result;
    } catch (error: any) {
      logger.error(`❌ Error processing job ${job.id}`, { 
        jobId: job.id,
        modelId: job.data.modelId,
        region: job.data.region,
        error: error.message,
        stack: error.stack
      });
      throw error; // Re-throw para Bull retry
    }
  }

  /**
   * Atualiza CertificationJob quando job inicia (hook: active)
   */
  private async updateJobOnActive(job: Job): Promise<void> {
    try {
      const { jobId } = job.data;
      
      if (!jobId) {
        logger.warn(`Job ${job.id} sem jobId no data, pulando atualização`, { job: job.data });
        return;
      }

      await prisma.certificationJob.update({
        where: { id: jobId },
        data: {
          status: 'PROCESSING',
          startedAt: new Date()
        }
      });

      logger.debug(`📊 CertificationJob ${jobId} atualizado para PROCESSING`, {
        bullJobId: job.id,
        jobId
      });
    } catch (error: any) {
      // Não deve quebrar o worker se falhar atualização
      logger.error(`❌ Erro ao atualizar job no hook active`, {
        bullJobId: job.id,
        jobId: job.data.jobId,
        error: error.message
      });
    }
  }

  /**
   * Atualiza CertificationJob quando job completa (hook: completed)
   */
  private async updateJobOnCompleted(job: Job, result: any): Promise<void> {
    try {
      const { jobId } = job.data;
      
      if (!jobId) {
        logger.warn(`Job ${job.id} sem jobId no data, pulando atualização`, { job: job.data });
        return;
      }

      // Buscar job atual para calcular se está completo
      const certJob = await prisma.certificationJob.findUnique({
        where: { id: jobId }
      });

      if (!certJob) {
        logger.warn(`CertificationJob ${jobId} não encontrado`, { bullJobId: job.id });
        return;
      }

      // Verificar se todos os modelos foram processados
      const isComplete = certJob.processedModels >= certJob.totalModels;
      const completedAt = isComplete ? new Date() : null;
      const duration = isComplete && certJob.startedAt 
        ? Date.now() - certJob.startedAt.getTime() 
        : null;

      await prisma.certificationJob.update({
        where: { id: jobId },
        data: {
          status: isComplete ? 'COMPLETED' : 'PROCESSING',
          completedAt,
          duration
        }
      });

      logger.debug(`📊 CertificationJob ${jobId} atualizado após conclusão`, {
        bullJobId: job.id,
        jobId,
        isComplete,
        processedModels: certJob.processedModels,
        totalModels: certJob.totalModels
      });
    } catch (error: any) {
      // Não deve quebrar o worker se falhar atualização
      logger.error(`❌ Erro ao atualizar job no hook completed`, {
        bullJobId: job.id,
        jobId: job.data.jobId,
        error: error.message
      });
    }
  }

  /**
   * Atualiza CertificationJob quando job falha (hook: failed)
   */
  private async updateJobOnFailed(job: Job, err: Error): Promise<void> {
    try {
      const { jobId } = job.data;
      
      if (!jobId) {
        logger.warn(`Job ${job.id} sem jobId no data, pulando atualização`, { job: job.data });
        return;
      }

      // Buscar job atual
      const certJob = await prisma.certificationJob.findUnique({
        where: { id: jobId }
      });

      if (!certJob) {
        logger.warn(`CertificationJob ${jobId} não encontrado`, { bullJobId: job.id });
        return;
      }

      // Verificar se todos os modelos foram processados (mesmo com falha)
      const isComplete = certJob.processedModels >= certJob.totalModels;
      const completedAt = isComplete ? new Date() : null;
      const duration = isComplete && certJob.startedAt 
        ? Date.now() - certJob.startedAt.getTime() 
        : null;

      await prisma.certificationJob.update({
        where: { id: jobId },
        data: {
          status: isComplete ? 'FAILED' : 'PROCESSING',
          completedAt,
          duration
        }
      });

      logger.debug(`📊 CertificationJob ${jobId} atualizado após falha`, {
        bullJobId: job.id,
        jobId,
        isComplete,
        error: err.message
      });
    } catch (error: any) {
      // Não deve quebrar o worker se falhar atualização
      logger.error(`❌ Erro ao atualizar job no hook failed`, {
        bullJobId: job.id,
        jobId: job.data.jobId,
        error: error.message
      });
    }
  }

  /**
   * Obtém status do worker
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      queueName: this.queueName,
      concurrency: this.concurrency
    };
  }

  /**
   * Obtém estatísticas da fila
   */
  public async getQueueStats() {
    try {
      const counts = await queueService.getQueueCounts(this.queueName);
      return {
        ...counts,
        queueName: this.queueName,
        concurrency: this.concurrency,
        isRunning: this.isRunning
      };
    } catch (error: any) {
      logger.error('❌ Error getting queue stats', { 
        error: error.message 
      });
      throw error;
    }
  }
}

// Singleton
export const certificationWorker = new CertificationWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down worker...');
  try {
    await certificationWorker.stop();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down worker...');
  try {
    await certificationWorker.stop();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
});
