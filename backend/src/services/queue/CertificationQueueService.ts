// backend/src/services/queue/CertificationQueueService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Job } from 'bull';
import { PrismaClient, Prisma } from '@prisma/client';
import { queueService } from './QueueService';
import { logger } from '../../utils/logger';
import { config } from '../../config/env';
import { CertificationJobData, CertificationResult } from '../../types/certification-queue';
import { ModelCertificationService } from '../ai/certification/certification.service';
import { ModelRegistry } from '../ai/registry';

const prisma = new PrismaClient();

// Instância única do serviço de certificação
const certificationService = new ModelCertificationService();

export class CertificationQueueService {
  private queueName: string;
  private queue: any;

  constructor() {
    this.queueName = config.certificationQueueName as string;
    this.initializeQueue();
  }

  /**
   * Inicializa a fila de certificação
   */
  private initializeQueue() {
    this.queue = queueService.getQueue({
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

    // 1. Buscar informações do modelo e validar no Registry
    const model = await prisma.aIModel.findUnique({
      where: { id: modelId },
      select: { id: true, apiModelId: true, name: true }
    });

    if (!model) {
      throw new Error(`Modelo ${modelId} não encontrado no banco de dados`);
    }

    if (!ModelRegistry.isSupported(model.apiModelId)) {
      logger.error(`❌ Modelo ${model.name} (${model.apiModelId}) não encontrado no ModelRegistry`);
      throw new Error(`Modelo ${model.name} (${model.apiModelId}) não suportado - não existe no ModelRegistry`);
    }

    logger.info(`✅ Modelo ${model.name} (${model.apiModelId}) validado no ModelRegistry`);

    // 2. Criar registro no banco
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

    // 3. Criar certificação no banco
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

    // 4. Adicionar job à fila Bull
    const bullJob = await queueService.addJob<CertificationJobData>(
      this.queueName,
      {
        jobId: certificationJob.id,
        modelId,
        region,
        createdBy
      },
      {
        jobId: certification.id, // Usar ID da certificação como jobId do Bull
        attempts: parseInt(config.certificationMaxRetries as string, 10),
        timeout: parseInt(config.certificationTimeout as string, 10)
      }
    );

    // 5. Atualizar com bullJobId
    await prisma.certificationJob.update({
      where: { id: certificationJob.id },
      data: {
        bullJobId: bullJob.id?.toString(),
        status: 'QUEUED'
      }
    });

    await prisma.modelCertification.update({
      where: { id: certification.id },
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

    // 1. Buscar informações dos modelos e validar no Registry
    const modelsInfo = await prisma.aIModel.findMany({
      where: { id: { in: modelIds } },
      select: { id: true, apiModelId: true, name: true }
    });

    // Validar cada modelo no Registry
    const validModels: typeof modelsInfo = [];
    const invalidModels: string[] = [];
    
    for (const model of modelsInfo) {
      if (ModelRegistry.isSupported(model.apiModelId)) {
        validModels.push(model);
      } else {
        invalidModels.push(`${model.name} (${model.apiModelId})`);
        logger.warn(`⚠️ Modelo ${model.name} (${model.apiModelId}) não encontrado no ModelRegistry - ignorando`);
      }
    }

    if (invalidModels.length > 0) {
      logger.warn(`⚠️ ${invalidModels.length} modelos ignorados por não existirem no ModelRegistry: ${invalidModels.join(', ')}`);
    }

    if (validModels.length === 0) {
      throw new Error('Nenhum modelo válido encontrado no ModelRegistry para certificação');
    }

    const validModelIds = validModels.map(m => m.id);

    // 2. Criar registro do job PAI no banco
    const certificationJob = await prisma.certificationJob.create({
      data: {
        type: 'MULTIPLE_MODELS',
        regions,
        modelIds: validModelIds,
        status: 'PENDING',
        totalModels: validModelIds.length * regions.length,
        createdBy
      }
    });

    // 3. Criar jobs individuais no Bull (todos vinculados ao job PAI)
    let jobCount = 0;
    for (const modelId of validModelIds) {
      for (const region of regions) {
        // Criar ou atualizar certificação no banco
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

        // Adicionar job à fila Bull (vinculado ao job PAI)
        const bullJob = await queueService.addJob<CertificationJobData>(
          this.queueName,
          {
            jobId: certificationJob.id, // ← Job PAI, não individual!
            modelId,
            region,
            createdBy
          },
          {
            jobId: `${certificationJob.id}-${certification.id}`, // ID único para o Bull
            attempts: parseInt(config.certificationMaxRetries as string, 10),
            timeout: parseInt(config.certificationTimeout as string, 10)
          }
        );

        await prisma.modelCertification.update({
          where: { id: certification.id },
          data: {
            jobId: bullJob.id?.toString(),
            status: 'QUEUED'
          }
        });

        jobCount++;
      }
    }

    // 4. Atualizar status do job PAI
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
   * Certifica todos os modelos Bedrock em regiões específicas
   *
   * IMPORTANTE: Filtra apenas modelos do provider 'bedrock' que existem no ModelRegistry
   * para evitar erros de certificação de modelos não suportados.
   */
  public async certifyAllModels(
    regions: string[],
    createdBy?: string
  ): Promise<{ jobId: string; totalJobs: number }> {
    logger.info(`📝 Criando job de certificação de TODOS os modelos Bedrock em ${regions.length} regiões`);

    // 1. Buscar todos os modelos ativos do provider Bedrock
    const models = await prisma.aIModel.findMany({
      where: {
        isActive: true,
        provider: {
          slug: 'bedrock'
        }
      },
      select: {
        id: true,
        apiModelId: true,
        name: true
      }
    });

    logger.info(`📊 Encontrados ${models.length} modelos Bedrock ativos no banco`);

    // 2. Filtrar apenas modelos que existem no ModelRegistry
    const validModels = models.filter(model => {
      const existsInRegistry = ModelRegistry.isSupported(model.apiModelId);
      if (!existsInRegistry) {
        logger.warn(`⚠️ Modelo ${model.name} (${model.apiModelId}) não encontrado no ModelRegistry - ignorando`);
      }
      return existsInRegistry;
    });

    logger.info(`✅ ${validModels.length} modelos válidos no ModelRegistry (de ${models.length} no banco)`);

    if (validModels.length === 0) {
      logger.warn(`⚠️ Nenhum modelo Bedrock válido encontrado para certificação`);
      throw new Error('Nenhum modelo Bedrock válido encontrado para certificação');
    }

    const modelIds = validModels.map(m => m.id);

    // 3. Usar certifyMultipleModels
    return this.certifyMultipleModels(modelIds, regions, createdBy);
  }

  /**
   * Processa um job de certificação
   * PÚBLICO para ser usado pelo worker dedicado
   */
  public async processCertification(
    job: Job<CertificationJobData>
  ): Promise<CertificationResult> {
    const { jobId, modelId, region } = job.data;
    const startTime = Date.now();

    logger.info(`▶️  Processando certificação: ${modelId} @ ${region}`);

    try {
      // 1. Criar/Atualizar registro de JobCertification e ModelCertification
      // Usa upsert para suportar retries (evita unique constraint violation)
      const [jobCert, _] = await Promise.all([
        prisma.jobCertification.upsert({
          where: {
            jobId_modelId_region: { jobId, modelId, region }
          },
          create: {
            jobId,
            modelId,
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
        prisma.modelCertification.update({
          where: {
            modelId_region: { modelId, region }
          },
          data: {
            status: 'PROCESSING',
            startedAt: new Date()
          }
        })
      ]);

      // 2. Executar certificação REAL usando ModelCertificationService
      // 
      // ⚠️ CONFIGURAÇÃO: Usa credenciais AWS do ambiente (.env)
      // Formato esperado: AWS_BEDROCK_CREDENTIALS=ACCESS_KEY:SECRET_KEY
      //
      // Se CERTIFICATION_SIMULATION=true no .env, usa modo simulado (fallback)
      
      const useSimulation = process.env.CERTIFICATION_SIMULATION === 'true';
      
      let passed: boolean;
      let score: number;
      let rating: number | null;  // Float (0-5.0) - usar null se não calculado
      let badge: string;          // String descritiva (CERTIFIED, FAILED, etc)
      let testResults: any;
      
      if (useSimulation) {
        // ⚠️ SIMULAÇÃO: Este bloco NÃO executa lógica real
        // TODO: Remover quando certificação real estiver estável
        logger.warn(`🎭 SIMULAÇÃO ATIVA: Certificação de ${modelId} @ ${region}`);
        
        passed = Math.random() > 0.3;
        score = passed ? 75 + Math.random() * 25 : 30 + Math.random() * 40;
        // Rating numérico: 0-5 baseado no score (0-100)
        rating = score / 20;  // Converte 0-100 para 0-5
        badge = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
        testResults = { simulated: true, simulatedAt: new Date().toISOString() };
      } else {
        // ✅ CERTIFICAÇÃO REAL usando AWS Bedrock
        const credentials = process.env.AWS_BEDROCK_CREDENTIALS;
        
        if (!credentials) {
          throw new Error('AWS_BEDROCK_CREDENTIALS não configurado no ambiente');
        }
        
        const [accessKey, secretKey] = credentials.split(':');
        if (!accessKey || !secretKey) {
          throw new Error('Formato inválido de AWS_BEDROCK_CREDENTIALS (esperado: ACCESS_KEY:SECRET_KEY)');
        }
        
        // Buscar apiModelId do modelo no banco
        const model = await prisma.aIModel.findUnique({
          where: { id: modelId },
          select: { apiModelId: true, name: true }
        });
        
        if (!model) {
          throw new Error(`Modelo ${modelId} não encontrado no banco de dados`);
        }
        
        logger.info(`🔧 Executando certificação REAL: ${model.name} (${model.apiModelId}) @ ${region}`);
        
        // Chamar serviço de certificação real
        const result = await certificationService.certifyModel(
          model.apiModelId,  // Usar apiModelId (ex: "amazon.nova-lite-v1:0")
          {
            accessKey,
            secretKey,
            region  // Região específica do job
          },
          true  // force = true para não usar cache interno do service
        );
        
        // Mapear campos do CertificationResult para variáveis locais
        passed = result.isCertified;  // isCertified indica se passou na certificação
        score = result.successRate;   // successRate é a taxa de sucesso (0-100)
        // rating numérico: 0-5 baseado no score (0-100)
        rating = score / 20;  // Converte 0-100 para 0-5
        badge = result.status;        // status contém CERTIFIED, FAILED, QUALITY_WARNING, etc
        testResults = result.results; // results contém os TestResult[]
      }
      
      const duration = Date.now() - startTime;

      // 3. Atualizar JobCertification e ModelCertification com resultado
      await Promise.all([
        prisma.jobCertification.update({
          where: { id: jobCert.id },
          data: {
            status: passed ? 'PASSED' : 'FAILED',
            completedAt: new Date(),
            duration,
            details: {
              timestamp: new Date().toISOString(),
              score,
              rating,
              badge,
              testResults
            } as any
          }
        }),
        prisma.modelCertification.update({
          where: {
            modelId_region: { modelId, region }
          },
          data: {
            status: passed ? 'CERTIFIED' : 'FAILED',
            passed,
            score,
            rating,
            badge,
            testResults: testResults as any,
            completedAt: new Date(),
            duration
          }
        })
      ]);

      // 4. Atualizar contadores do job
      await prisma.certificationJob.update({
        where: { id: jobId },
        data: {
          processedModels: { increment: 1 },
          successCount: passed ? { increment: 1 } : undefined,
          failureCount: !passed ? { increment: 1 } : undefined
        }
      });

      logger.info(`✅ Certificação concluída: ${modelId} @ ${region} (${duration}ms, status: ${passed ? 'PASSED' : 'FAILED'})`);

      return {
        modelId,
        region,
        passed,
        score,
        rating,
        badge,
        testResults,
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';
      const errorCategory = error.category || 'UNKNOWN';

      logger.error(`❌ Erro na certificação: ${modelId} @ ${region}`, error);

      // Atualizar JobCertification e ModelCertification com erro
      await Promise.all([
        prisma.jobCertification.updateMany({
          where: {
            jobId,
            modelId,
            region,
            status: 'PROCESSING'
          },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            duration,
            error: errorMessage
          }
        }),
        prisma.modelCertification.update({
          where: {
            modelId_region: { modelId, region }
          },
          data: {
            status: 'FAILED',
            passed: false,
            errorMessage,
            errorCategory,
            completedAt: new Date(),
            duration
          }
        })
      ]);

      // Atualizar contadores do job
      await prisma.certificationJob.update({
        where: { id: jobId },
        data: {
          processedModels: { increment: 1 },
          failureCount: { increment: 1 }
        }
      });

      throw error; // Re-throw para Bull retry
    }
  }

  /**
   * Obtém status de um job
   */
  public async getJobStatus(jobId: string) {
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
   * Cancela um job
   */
  public async cancelJob(jobId: string): Promise<void> {
    const job = await prisma.certificationJob.findUnique({
      where: { id: jobId }
    });

    if (!job || !job.bullJobId) {
      throw new Error('Job not found or no Bull job ID');
    }

    // Cancelar job no Bull
    const bullJob = await this.queue.getJob(job.bullJobId);
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

  /**
   * Obtém estatísticas da fila
   */
  public async getQueueStats() {
    const counts = await queueService.getQueueCounts(this.queueName);
    
    const dbStats = await prisma.certificationJob.groupBy({
      by: ['status'],
      _count: true
    });

    return {
      queue: counts,
      database: dbStats
    };
  }
}

// Singleton
export const certificationQueueService = new CertificationQueueService();
