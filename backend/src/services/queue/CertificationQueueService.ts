// backend/src/services/queue/CertificationQueueService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Job } from 'bull';
import { queueService } from './QueueService';
import { logger } from '../../utils/logger';
import { config } from '../../config/env';
import { CertificationJobData, CertificationResult } from '../../types/certification-queue';
import { ModelCertificationService } from '../ai/certification/certification.service';

// Importar módulos criados
import { ModelValidator } from './validators/ModelValidator';
import { JobCreator } from './creators/JobCreator';
import { JobProcessor } from './processors/JobProcessor';
import { StatusUpdater } from './processors/StatusUpdater';
import { StatusQuery } from './queries/StatusQuery';

// Instância única do serviço de certificação
const certificationService = new ModelCertificationService();

/**
 * CertificationQueueService
 * 
 * Responsabilidade: Orquestração e delegação (Facade Pattern)
 * - Inicializa a fila de certificação
 * - Delega validação para ModelValidator
 * - Delega criação de jobs para JobCreator
 * - Delega processamento para JobProcessor
 * - Delega consultas para StatusQuery
 * 
 * API Pública mantida IDÊNTICA para zero breaking changes
 */
export class CertificationQueueService {
  private queueName: string;

  // Dependências injetadas
  private modelValidator: ModelValidator;
  private jobCreator: JobCreator;
  private jobProcessor: JobProcessor;
  private statusQuery: StatusQuery;

  constructor() {
    this.queueName = config.certificationQueueName as string;
    this.initializeQueue();

    // Injetar dependências
    this.modelValidator = new ModelValidator();
    this.jobCreator = new JobCreator(queueService, this.queueName);

    const statusUpdater = new StatusUpdater();
    this.jobProcessor = new JobProcessor(certificationService, statusUpdater);

    this.statusQuery = new StatusQuery(queueService, this.queueName);
  }

  /**
   * Inicializa a fila de certificação
   */
  private initializeQueue() {
    queueService.getQueue({
      name: this.queueName,
      concurrency: parseInt(config.certificationConcurrency as string, 10),
      limiter: {
        max: 5, // Máximo 5 jobs por segundo
        duration: 1000
      }
    });

    // NOTA: Processador removido - será registrado pelo worker dedicado
    // O worker irá chamar processCertification() diretamente

    logger.info(`✅ CertificationQueueService initialized (queue: ${this.queueName})`);
  }

  /**
   * Certifica um modelo específico em uma região
   * 
   * IMPORTANTE: Valida se o modelo existe no ModelRegistry antes de criar o job
   */
  public async certifyModel(
    modelId: string,
    region: string,
    createdBy?: string
  ): Promise<{ jobId: string; bullJobId: string }> {
    logger.info(`📝 Criando job de certificação: ${modelId} @ ${region}`);

    // Validar modelo
    const model = await this.modelValidator.validateModel(modelId);

    // Criar job
    return this.jobCreator.createSingleJob(model.uuid, region, createdBy);
  }

  /**
   * Certifica múltiplos modelos em múltiplas regiões
   * 
   * IMPORTANTE: Valida cada modelo no ModelRegistry antes de criar o job
   */
  public async certifyMultipleModels(
    modelIds: string[],
    regions: string[],
    createdBy?: string
  ): Promise<{ jobId: string; totalJobs: number }> {
    logger.info(`📝 Criando job de certificação em lote: ${modelIds.length} modelos x ${regions.length} regiões`);

    // Validar modelos
    const { valid, invalid } = await this.modelValidator.validateModels(modelIds);

    if (invalid.length > 0) {
      logger.warn(`⚠️ ${invalid.length} modelos ignorados por não existirem no ModelRegistry: ${invalid.join(', ')}`);
    }

    if (valid.length === 0) {
      throw new Error('Nenhum modelo válido encontrado no ModelRegistry para certificação');
    }

    const validModelIds = valid.map(m => m.uuid);

    // Criar jobs
    return this.jobCreator.createBatchJob(validModelIds, regions, createdBy);
  }

  /**
   * Certifica todos os modelos Bedrock em regiões específicas
   * 
   * IMPORTANTE: Filtra apenas modelos do provider 'bedrock' que existem no ModelRegistry
   */
  public async certifyAllModels(
    regions: string[],
    createdBy?: string
  ): Promise<{ jobId: string; totalJobs: number }> {
    logger.info(`📝 Criando job de certificação de TODOS os modelos Bedrock em ${regions.length} regiões`);

    // Buscar modelos válidos
    const validModels = await this.modelValidator.getValidBedrockModels();
    const modelIds = validModels.map(m => m.uuid);

    // Criar jobs
    return this.jobCreator.createBatchJob(modelIds, regions, createdBy);
  }

  /**
   * Processa um job de certificação
   * PÚBLICO para ser usado pelo worker dedicado
   */
  public async processCertification(
    job: Job<CertificationJobData>
  ): Promise<CertificationResult> {
    return this.jobProcessor.process(job);
  }

  /**
   * Obtém status de um job
   */
  public async getJobStatus(jobId: string) {
    return this.statusQuery.getJobStatus(jobId);
  }

  /**
   * Cancela um job
   */
  public async cancelJob(jobId: string): Promise<void> {
    return this.statusQuery.cancelJob(jobId);
  }

  /**
   * Obtém estatísticas da fila
   */
  public async getQueueStats() {
    return this.statusQuery.getQueueStats();
  }
}

// Singleton
export const certificationQueueService = new CertificationQueueService();
