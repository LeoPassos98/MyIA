// backend/src/services/queue/QueueService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import Bull, { Queue, Job, JobOptions } from 'bull';
import { redisConfig } from '../../config/redis';
import { logger } from '../../utils/logger';

export interface QueueConfig {
  name: string;
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
  defaultJobOptions?: JobOptions;
}

export class QueueService {
  private queues: Map<string, Queue> = new Map();
  private readonly prefix: string;

  constructor() {
    this.prefix = process.env.BULL_QUEUE_PREFIX || 'myia';
  }

  /**
   * Cria ou retorna uma fila existente
   */
  public getQueue(config: QueueConfig): Queue {
    const { name, limiter, defaultJobOptions } = config;

    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queue = new Bull(name, {
      redis: redisConfig,
      prefix: this.prefix,
      defaultJobOptions: {
        attempts: parseInt(process.env.CERTIFICATION_MAX_RETRIES || '3', 10),
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100, // Manter últimos 100 jobs completados
        removeOnFail: 500, // Manter últimos 500 jobs falhados
        timeout: parseInt(process.env.CERTIFICATION_TIMEOUT || '300000', 10),
        ...defaultJobOptions
      },
      limiter: limiter || {
        max: 10,
        duration: 1000
      }
    });

    // Event handlers
    queue.on('error', (error) => {
      logger.error(`❌ Queue ${name} error:`, error);
    });

    queue.on('waiting', (jobId) => {
      logger.info(`⏳ Job ${jobId} waiting in queue ${name}`);
    });

    queue.on('active', (job) => {
      logger.info(`▶️  Job ${job.id} active in queue ${name}`);
    });

    queue.on('completed', (job) => {
      logger.info(`✅ Job ${job.id} completed in queue ${name}`);
    });

    queue.on('failed', (job, err) => {
      logger.error(`❌ Job ${job?.id} failed in queue ${name}:`, err.message);
    });

    queue.on('stalled', (job) => {
      logger.warn(`⚠️  Job ${job.id} stalled in queue ${name}`);
    });

    this.queues.set(name, queue);
    return queue;
  }

  /**
   * Adiciona job à fila
   */
  public async addJob<T = any>(
    queueName: string,
    data: T,
    options?: JobOptions
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found. Call getQueue() first.`);
    }

    return queue.add(data, options);
  }

  /**
   * Obtém status de um job
   */
  public async getJobStatus(queueName: string, jobId: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();
    const failedReason = job.failedReason;

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    };
  }

  /**
   * Lista jobs por estado
   */
  public async getJobs(
    queueName: string,
    state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    start = 0,
    end = 10
  ): Promise<Job[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.getJobs([state], start, end);
  }

  /**
   * Obtém contadores da fila
   */
  public async getQueueCounts(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.getJobCounts();
  }

  /**
   * Limpa jobs completados
   */
  public async cleanQueue(
    queueName: string,
    grace: number = 3600000 // 1 hora
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
  }

  /**
   * Pausa fila
   */
  public async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
  }

  /**
   * Resume fila
   */
  public async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
  }

  /**
   * Fecha todas as filas
   */
  public async closeAll(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map(queue =>
      queue.close()
    );
    await Promise.all(closePromises);
    this.queues.clear();
  }
}

// Singleton
export const queueService = new QueueService();
