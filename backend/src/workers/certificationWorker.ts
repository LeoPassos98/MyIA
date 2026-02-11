// backend/src/workers/certificationWorker.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
/* eslint-disable @typescript-eslint/no-explicit-any */
// Nota: Este arquivo usa 'any' para tipos dinâmicos do Bull queue

import dotenv from 'dotenv';
// 🔍 DEBUG: Carregar .env ANTES de qualquer import
dotenv.config();

import { Job } from 'bull';
import { queueService } from '../services/queue/QueueService';
import { certificationQueueService } from '../services/queue/CertificationQueueService';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { prisma } from '../lib/prisma';

// 🔍 DEBUG: Log das variáveis de ambiente no início do worker
logger.info('🔍 DEBUG - Worker iniciado com variáveis de ambiente:', {
  CERTIFICATION_SIMULATION: process.env.CERTIFICATION_SIMULATION,
  CERTIFICATION_SIMULATION_type: typeof process.env.CERTIFICATION_SIMULATION,
  NODE_ENV: process.env.NODE_ENV,
  AWS_BEDROCK_REGION: process.env.AWS_BEDROCK_REGION
});

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
      const completedTimestamp = new Date().toISOString();
      logger.info(`✅ Job ${job.id} completed`, { 
        jobId: job.id,
        modelId: job.data.modelId,
        region: job.data.region,
        result,
        timestamp: completedTimestamp
      });
      
      // 🔍 LOG: Estado antes de atualizar banco
      logger.info(`🔍 [SYNC-CHECK] Job completed - ANTES de atualizar banco`, {
        bullJobId: job.id,
        modelId: job.data.modelId,
        region: job.data.region,
        redisState: 'completed',
        resultPassed: result?.passed,
        resultScore: result?.score,
        timestamp: completedTimestamp
      });
      
      // Atualizar CertificationJob no banco
      await this.updateJobOnCompleted(job, result);
      
      // 🔍 LOG: Verificar se banco foi atualizado com sucesso
      try {
        // CORREÇÃO Schema v2: job.data.deploymentId é o UUID do ModelDeployment
        // A tabela ModelCertification usa deploymentId como FK
        const deploymentId = job.data.deploymentId;
        
        if (!deploymentId) {
          logger.warn(`Job ${job.id} sem deploymentId no data, pulando verificação de sincronia`, { job: job.data });
          return;
        }
        
        const certInDb = await prisma.modelCertification.findUnique({
          where: {
            deploymentId_region: {
              deploymentId: deploymentId,
              region: job.data.region
            }
          },
          select: {
            status: true,
            passed: true,
            score: true,
            completedAt: true
          }
        });
        
        logger.info(`🔍 [SYNC-CHECK] Job completed - DEPOIS de atualizar banco`, {
          bullJobId: job.id,
          deploymentId: deploymentId,
          region: job.data.region,
          redisState: 'completed',
          dbState: certInDb?.status || 'NOT_FOUND',
          dbPassed: certInDb?.passed,
          dbScore: certInDb?.score,
          dbCompletedAt: certInDb?.completedAt,
          syncOk: certInDb?.status === 'PASSED' || certInDb?.status === 'FAILED',
          timestamp: new Date().toISOString()
        });
        
        // ⚠️ ALERTA: Detectar dessincronia
        if (!certInDb || (certInDb.status !== 'PASSED' && certInDb.status !== 'FAILED')) {
          logger.error(`🚨 [SYNC-ERROR] Dessincronia detectada! Job completed no Redis mas banco não atualizado`, {
            bullJobId: job.id,
            deploymentId: deploymentId,
            region: job.data.region,
            redisResult: result,
            dbState: certInDb,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error: any) {
        logger.error(`❌ Erro ao verificar sincronia banco↔Redis`, {
          bullJobId: job.id,
          error: error.message
        });
      }
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
      const activeTimestamp = new Date().toISOString();
      logger.info(`▶️  Job ${job.id} started processing`, {
        jobId: job.id,
        modelId: job.data.modelId,
        region: job.data.region,
        timestamp: activeTimestamp
      });
      
      // Atualizar CertificationJob no banco
      await this.updateJobOnActive(job);
      
      // 🔍 LOG: Verificar sincronia banco↔Redis após active
      logger.debug(`🔍 [SYNC-CHECK] Job active - verificando estado no banco`, {
        bullJobId: job.id,
        modelId: job.data.modelId,
        region: job.data.region,
        redisState: 'active',
        timestamp: activeTimestamp
      });
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
   * Atualiza ModelCertification quando job inicia (hook: active)
   * Schema v2: CertificationJob foi removido, usar ModelCertification diretamente
   */
  private async updateJobOnActive(job: Job): Promise<void> {
    try {
      const { deploymentId, region } = job.data;
      
      if (!deploymentId || !region) {
        logger.warn(`Job ${job.id} sem deploymentId/region no data, pulando atualização`, { job: job.data });
        return;
      }

      // Schema v2: Atualizar ModelCertification diretamente
      await prisma.modelCertification.upsert({
        where: {
          deploymentId_region: { deploymentId, region }
        },
        update: {
          status: 'RUNNING',
          startedAt: new Date(),
          jobId: String(job.id)
        },
        create: {
          deploymentId,
          region,
          status: 'RUNNING',
          startedAt: new Date(),
          jobId: String(job.id)
        }
      });

      logger.debug(`📊 ModelCertification ${deploymentId}/${region} atualizado para RUNNING`, {
        bullJobId: job.id,
        deploymentId,
        region
      });
    } catch (error: unknown) {
      // Não deve quebrar o worker se falhar atualização
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Erro ao atualizar job no hook active`, {
        bullJobId: job.id,
        deploymentId: job.data.deploymentId,
        region: job.data.region,
        error: errorMessage
      });
    }
  }

  /**
   * Atualiza ModelCertification quando job completa (hook: completed)
   * Schema v2: CertificationJob foi removido, usar ModelCertification diretamente
   */
  private async updateJobOnCompleted(job: Job, result: unknown): Promise<void> {
    try {
      const { deploymentId, region } = job.data;
      
      if (!deploymentId || !region) {
        logger.warn(`Job ${job.id} sem deploymentId/region no data, pulando atualização`, { job: job.data });
        return;
      }

      const now = new Date();
      const certResult = result as { passed?: boolean; score?: number } | null;
      const passed = certResult?.passed ?? false;
      const score = certResult?.score ?? 0;
      const status = passed ? 'PASSED' : 'FAILED';

      // Buscar certificação para calcular duração
      const existingCert = await prisma.modelCertification.findUnique({
        where: {
          deploymentId_region: { deploymentId, region }
        },
        select: { startedAt: true }
      });

      const duration = existingCert?.startedAt
        ? now.getTime() - existingCert.startedAt.getTime()
        : null;

      // 🔍 LOG: Antes de atualizar ModelCertification
      logger.debug(`🔍 [DB-UPDATE] Atualizando ModelCertification`, {
        bullJobId: job.id,
        deploymentId,
        region,
        newStatus: status,
        passed,
        score
      });
      
      await prisma.modelCertification.update({
        where: {
          deploymentId_region: { deploymentId, region }
        },
        data: {
          status,
          passed,
          score,
          completedAt: now,
          duration,
          certifiedAt: passed ? now : null
        }
      });

      logger.info(`✅ [DB-UPDATE] ModelCertification atualizado com sucesso`, {
        bullJobId: job.id,
        deploymentId,
        region,
        status,
        passed,
        score
      });
    } catch (error: unknown) {
      // Não deve quebrar o worker se falhar atualização
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Erro ao atualizar job no hook completed`, {
        bullJobId: job.id,
        deploymentId: job.data.deploymentId,
        region: job.data.region,
        error: errorMessage
      });
    }
  }

  /**
   * Atualiza ModelCertification quando job falha (hook: failed)
   * Schema v2: CertificationJob foi removido, usar ModelCertification diretamente
   */
  private async updateJobOnFailed(job: Job, err: Error): Promise<void> {
    try {
      const { deploymentId, region } = job.data;
      
      if (!deploymentId || !region) {
        logger.warn(`Job ${job.id} sem deploymentId/region no data, pulando atualização`, { job: job.data });
        return;
      }

      const now = new Date();

      // Buscar certificação para calcular duração
      const existingCert = await prisma.modelCertification.findUnique({
        where: {
          deploymentId_region: { deploymentId, region }
        },
        select: { startedAt: true }
      });

      const duration = existingCert?.startedAt
        ? now.getTime() - existingCert.startedAt.getTime()
        : null;

      await prisma.modelCertification.update({
        where: {
          deploymentId_region: { deploymentId, region }
        },
        data: {
          status: 'ERROR',
          passed: false,
          completedAt: now,
          duration,
          lastError: err.message,
          errorMessage: err.message
        }
      });

      logger.debug(`📊 ModelCertification ${deploymentId}/${region} atualizado após falha`, {
        bullJobId: job.id,
        deploymentId,
        region,
        error: err.message
      });
    } catch (error: unknown) {
      // Não deve quebrar o worker se falhar atualização
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Erro ao atualizar job no hook failed`, {
        bullJobId: job.id,
        deploymentId: job.data.deploymentId,
        region: job.data.region,
        error: errorMessage
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
