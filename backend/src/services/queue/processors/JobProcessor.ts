// backend/src/services/queue/processors/JobProcessor.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../utils/logger';
import { CertificationJobData, CertificationResult } from '../../../types/certification-queue';
import { ModelCertificationService } from '../../ai/certification/certification.service';
import { StatusUpdater } from './StatusUpdater';

const prisma = new PrismaClient();

/**
 * JobProcessor
 * 
 * Responsabilidade: Processar certificação de um modelo (lógica de negócio)
 * - Identifica se modelId é UUID ou apiModelId
 * - Executa certificação (real ou simulada)
 * - Trata erros de certificação
 * - Delega atualização de status para StatusUpdater
 */
export class JobProcessor {
  constructor(
    private certificationService: ModelCertificationService,
    private statusUpdater: StatusUpdater
  ) {}

  /**
   * Processa certificação de um modelo
   * PÚBLICO para ser chamado pelo worker
   */
  async process(job: Job<CertificationJobData>): Promise<CertificationResult> {
    const { jobId, modelId: modelIdParam, region } = job.data;
    const startTime = Date.now();

    // Declarar variáveis fora do try para serem acessíveis no catch
    let modelUUID: string | undefined;
    let apiModelId: string | undefined;

    logger.info(`▶️  Processando certificação: ${modelIdParam} @ ${region}`);

    try {
      // 1. Resolver IDs do modelo (UUID e apiModelId)
      const resolvedIds = await this.resolveModelIds(modelIdParam);
      modelUUID = resolvedIds.uuid;
      apiModelId = resolvedIds.apiModelId;

      logger.info(`✅ Modelo identificado: UUID=${modelUUID}, apiModelId=${apiModelId}`);

      // 2. Atualizar status para PROCESSING
      await this.statusUpdater.updateOnStart(jobId, modelUUID, apiModelId, region);

      // 3. Executar certificação (real ou simulada)
      const certResult = await this.executeCertification(apiModelId, region);

      const duration = Date.now() - startTime;

      // 4. Atualizar registros com resultado
      await this.statusUpdater.updateOnSuccess(
        jobId,
        modelUUID,
        apiModelId,
        region,
        {
          ...certResult,
          duration
        }
      );

      // 5. Atualizar contadores do job
      await this.statusUpdater.updateJobCounters(jobId, {
        processed: 1,
        success: certResult.passed ? 1 : undefined,
        failure: !certResult.passed ? 1 : undefined
      });

      logger.info(`✅ Certificação concluída: ${apiModelId} @ ${region} (${duration}ms, status: ${certResult.passed ? 'PASSED' : 'FAILED'})`);

      // Retornar resultado para Bull
      const returnValue = {
        modelId: modelUUID,
        region,
        passed: certResult.passed,
        score: certResult.score,
        rating: certResult.rating,
        badge: certResult.badge,
        testResults: certResult.testResults,
        duration
      };

      logger.info(`🔍 [RETURN] Retornando resultado para Bull`, {
        modelId: apiModelId,
        region,
        returnValue,
        timestamp: new Date().toISOString()
      });

      return returnValue;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      await this.handleCertificationError(job, error, modelUUID, apiModelId, duration);
      throw error; // Re-throw para Bull retry
    }
  }

  /**
   * Identifica se modelId é UUID ou apiModelId e busca ambos
   */
  private async resolveModelIds(modelIdParam: string): Promise<{
    uuid: string;
    apiModelId: string;
  }> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelIdParam);

    if (isUUID) {
      // É UUID - buscar apiModelId
      const model = await prisma.aIModel.findUnique({
        where: { id: modelIdParam },
        select: { id: true, apiModelId: true }
      });

      if (!model) {
        throw new Error(`Modelo ${modelIdParam} não encontrado no banco de dados`);
      }

      return {
        uuid: model.id,
        apiModelId: model.apiModelId
      };
    } else {
      // É apiModelId - buscar UUID
      const model = await prisma.aIModel.findFirst({
        where: { apiModelId: modelIdParam },
        select: { id: true, apiModelId: true }
      });

      if (!model) {
        throw new Error(`Modelo ${modelIdParam} não encontrado no banco de dados`);
      }

      return {
        uuid: model.id,
        apiModelId: model.apiModelId
      };
    }
  }

  /**
   * Executa certificação (real ou simulada)
   */
  private async executeCertification(
    apiModelId: string,
    region: string
  ): Promise<{
    passed: boolean;
    score: number;
    rating: number | null;
    badge: string;
    testResults: any;
  }> {
    // Verificar modo de certificação
    logger.info('🔍 DEBUG - Verificando modo de certificação', {
      CERTIFICATION_SIMULATION_raw: process.env.CERTIFICATION_SIMULATION,
      CERTIFICATION_SIMULATION_type: typeof process.env.CERTIFICATION_SIMULATION,
      useSimulation_will_be: process.env.CERTIFICATION_SIMULATION === 'true',
      apiModelId,
      region
    });

    const useSimulation = process.env.CERTIFICATION_SIMULATION === 'true';

    logger.info(`🔍 DEBUG - Modo selecionado: ${useSimulation ? '🎭 SIMULAÇÃO' : '✅ REAL'}`, {
      useSimulation,
      apiModelId,
      region
    });

    let passed: boolean;
    let score: number;
    let rating: number | null;
    let badge: string;
    let testResults: any;

    if (useSimulation) {
      // ⚠️ SIMULAÇÃO: Este bloco NÃO executa lógica real
      // TODO: Remover quando certificação real estiver estável
      logger.warn(`🎭 SIMULAÇÃO ATIVA: Certificação de ${apiModelId} @ ${region}`);

      passed = Math.random() > 0.3;
      score = passed ? 75 + Math.random() * 25 : 30 + Math.random() * 40;
      rating = score / 20; // Converte 0-100 para 0-5
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

      logger.info(`🔧 Executando certificação REAL: ${apiModelId} @ ${region}`);

      // Chamar serviço de certificação real
      const result = await this.certificationService.certifyModel(
        apiModelId,
        {
          accessKey,
          secretKey,
          region
        },
        true // force = true para não usar cache interno do service
      );

      // Mapear campos do CertificationResult
      passed = result.isCertified;
      score = result.successRate;
      testResults = result.results;

      // Ler badge e rating CORRETOS do banco (salvos por certification.service via RatingCalculator)
      const savedCert = await prisma.modelCertification.findUnique({
        where: { modelId_region: { modelId: apiModelId, region } },
        select: { badge: true, rating: true }
      });
      badge = savedCert?.badge || (passed ? 'FUNCIONAL' : 'INDISPONIVEL');
      rating = savedCert?.rating || 0;
    }

    return {
      passed,
      score,
      rating,
      badge,
      testResults
    };
  }

  /**
   * Trata erros de certificação
   */
  private async handleCertificationError(
    job: Job<CertificationJobData>,
    error: Error,
    modelUUID?: string,
    apiModelId?: string,
    duration?: number
  ): Promise<void> {
    const { jobId, modelId: modelIdParam, region } = job.data;
    const errorMessage = error.message || 'Unknown error';
    const errorCategory = (error as any).category || 'UNKNOWN';
    const finalDuration = duration || Date.now() - Date.now();

    const modelIdForLog = modelUUID || modelIdParam;
    logger.error(`❌ Erro na certificação: ${modelIdForLog} @ ${region}`, error);

    // Resolver IDs se não disponíveis
    let finalApiModelId = apiModelId;
    let finalModelUUID = modelUUID;

    if (!apiModelId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelIdParam);
      if (isUUID) {
        const model = await prisma.aIModel.findUnique({
          where: { id: modelIdParam },
          select: { id: true, apiModelId: true }
        });
        finalApiModelId = model?.apiModelId || modelIdParam;
        finalModelUUID = model?.id || modelIdParam;
      } else {
        finalApiModelId = modelIdParam;
        const model = await prisma.aIModel.findFirst({
          where: { apiModelId: modelIdParam },
          select: { id: true }
        });
        finalModelUUID = model?.id || modelIdParam;
      }
    }

    // Atualizar registros com erro
    await this.statusUpdater.updateOnFailure(
      jobId,
      finalModelUUID!,
      finalApiModelId!,
      region,
      {
        message: errorMessage,
        category: errorCategory,
        duration: finalDuration
      }
    );

    // Atualizar contadores do job
    await this.statusUpdater.updateJobCounters(jobId, {
      processed: 1,
      failure: 1
    });
  }
}
