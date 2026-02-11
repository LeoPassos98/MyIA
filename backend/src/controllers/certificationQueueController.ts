// backend/src/controllers/certificationQueueController.ts
// Standards: docs/STANDARDS.md

import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { certificationQueueService } from '../services/queue/CertificationQueueService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/api-response';

// Importar módulos especializados
import { modelValidator } from './certificationQueue/validators/modelValidator';
import { regionValidator } from './certificationQueue/validators/regionValidator';
import { payloadValidator } from './certificationQueue/validators/payloadValidator';
import { responseTransformer } from './certificationQueue/transformers/responseTransformer';
import { errorHandler } from './certificationQueue/handlers/errorHandler';
import { awsStatusHandler } from './certificationQueue/handlers/awsStatusHandler';

const prisma = new PrismaClient();

/**
 * Interface para Request com propriedades customizadas
 */
interface AuthenticatedRequest extends Request {
  userId?: string;
  requestId?: string;
}

/**
 * POST /api/certification-queue/certify-model
 * Certifica um modelo específico em uma região
 */
export async function certifyModel(req: Request, res: Response) {
  try {
    logger.info('[certifyModel] Requisição recebida');

    // Validar payload
    const payloadValidation = payloadValidator.validateCertifyModelPayload(req.body);
    if (!payloadValidation.valid) {
      return res.status(400).json(
        ApiResponse.error(payloadValidation.error!, 400)
      );
    }

    const { modelId, region } = req.body;
    const userId = (req as AuthenticatedRequest).userId;

    // Validar modelo
    const modelValidation = await modelValidator.validateModelExists(modelId);
    if (!modelValidation.exists) {
      return res.status(404).json(
        ApiResponse.error('Model not found', 404)
      );
    }

    // Criar job de certificação
    const result = await certificationQueueService.certifyModel(
      modelId,
      region,
      userId
    );

    logger.info(`Certification job created: ${result.jobId} for model ${modelId} @ ${region}`);

    return res.status(201).json(
      ApiResponse.success({
        jobId: result.jobId,
        bullJobId: result.bullJobId,
        modelId,
        region,
        status: 'QUEUED'
      })
    );
  } catch (error: unknown) {
    return errorHandler.handleControllerError(error, res, {
      operation: 'certifyModel',
      params: { modelId: req.body.modelId, region: req.body.region }
    });
  }
}

/**
 * POST /api/certification-queue/certify-multiple
 * Certifica múltiplos modelos em múltiplas regiões
 */
export async function certifyMultipleModels(req: Request, res: Response) {
  try {
    logger.info('[certifyMultipleModels] Requisição recebida');

    // Validar payload
    const payloadValidation = payloadValidator.validateMultipleModelsPayload(req.body);
    if (!payloadValidation.valid) {
      return res.status(400).json(
        ApiResponse.error(payloadValidation.error!, 400)
      );
    }

    const { modelIds, regions } = req.body;
    const userId = (req as AuthenticatedRequest).userId;

    // Criar job de certificação em lote
    const result = await certificationQueueService.certifyMultipleModels(
      modelIds,
      regions,
      userId
    );

    logger.info(`Batch certification job created: ${result.jobId} (${result.totalJobs} jobs)`);

    return res.status(201).json(
      ApiResponse.success({
        jobId: result.jobId,
        totalJobs: result.totalJobs,
        modelIds,
        regions,
        status: 'QUEUED'
      })
    );
  } catch (error: unknown) {
    return errorHandler.handleControllerError(error, res, {
      operation: 'certifyMultipleModels',
      params: { modelIds: req.body.modelIds, regions: req.body.regions }
    });
  }
}

/**
 * POST /api/certification-queue/certify-all
 * Certifica todos os modelos ativos em regiões específicas
 */
export async function certifyAllModels(req: Request, res: Response) {
  try {
    logger.info('[certifyAllModels] Requisição recebida');

    // Validar payload
    const payloadValidation = payloadValidator.validateAllModelsPayload(req.body);
    if (!payloadValidation.valid) {
      return res.status(400).json(
        ApiResponse.error(payloadValidation.error!, 400)
      );
    }

    const { regions } = req.body;
    const userId = (req as AuthenticatedRequest).userId;

    // Criar job de certificação de todos os modelos
    const result = await certificationQueueService.certifyAllModels(
      regions,
      userId
    );

    logger.info(`All models certification job created: ${result.jobId} (${result.totalJobs} jobs)`);

    return res.status(201).json(
      ApiResponse.success({
        jobId: result.jobId,
        totalJobs: result.totalJobs,
        regions,
        status: 'QUEUED'
      })
    );
  } catch (error: unknown) {
    return errorHandler.handleControllerError(error, res, {
      operation: 'certifyAllModels',
      params: { regions: req.body.regions }
    });
  }
}

/**
 * GET /api/certification-queue/jobs/:jobId
 * Obtém status de um job específico
 */
export async function getJobStatus(req: Request, res: Response) {
  try {
    logger.info('[getJobStatus] Requisição recebida');

    // Validar jobId
    const paramValidation = payloadValidator.validateJobIdParam(req.params);
    if (!paramValidation.valid) {
      return res.status(400).json(
        ApiResponse.error(paramValidation.error!, 400)
      );
    }

    const { jobId } = req.params;

    // Buscar status do job
    const status = await certificationQueueService.getJobStatus(jobId);

    if (!status) {
      return errorHandler.handleNotFoundError('Job', jobId, res);
    }

    return res.status(200).json(
      ApiResponse.success(status)
    );
  } catch (error: unknown) {
    return errorHandler.handleControllerError(error, res, {
      operation: 'getJobStatus',
      params: { jobId: req.params.jobId }
    });
  }
}

/**
 * GET /api/certification-queue/history
 * Lista histórico de jobs de certificação
 * Schema v2: CertificationJob foi removido - usar Bull queue + ModelCertification
 */
export async function getJobHistory(req: Request, res: Response) {
  try {
    logger.info('[getJobHistory] Requisição recebida');

    // Validar paginação
    const paginationValidation = payloadValidator.validatePaginationParams(req.query as { page?: string; limit?: string });
    if (!paginationValidation.valid) {
      return res.status(400).json(
        ApiResponse.error(paginationValidation.error!, 400)
      );
    }

    const { page, limit } = paginationValidation;
    const { status } = req.query;
    const skip = (page! - 1) * limit!;

    // Schema v2: CertificationJob foi removido
    // Usar ModelCertification agrupado por data/região como "jobs"
    const where: Prisma.ModelCertificationWhereInput = {};
    if (status) {
      // Mapear status de job para status de certificação
      const statusMap: Record<string, string> = {
        'QUEUED': 'PENDING',
        'PROCESSING': 'RUNNING',
        'COMPLETED': 'PASSED',
        'FAILED': 'FAILED'
      };
      where.status = (statusMap[status as string] || status) as Prisma.EnumCertificationStatusFilter;
    }

    // Buscar certificações como histórico de jobs
    const [certifications, total] = await Promise.all([
      prisma.modelCertification.findMany({
        where,
        skip,
        take: limit,
        include: {
          deployment: {
            include: {
              baseModel: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.modelCertification.count({ where })
    ]);

    // Transformar certificações em formato de "jobs" para compatibilidade
    const jobs = certifications.map(cert => ({
      id: cert.id,
      type: 'SINGLE',
      status: cert.status,
      deploymentId: cert.deploymentId,
      region: cert.region,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt,
      certifications: [cert]
    }));

    return res.status(200).json(
      ApiResponse.success({
        jobs,
        pagination: {
          page: page!,
          limit: limit!,
          total,
          totalPages: Math.ceil(total / limit!)
        }
      })
    );
  } catch (error: unknown) {
    return errorHandler.handleControllerError(error, res, {
      operation: 'getJobHistory',
      params: req.query
    });
  }
}

/**
 * GET /api/certification-queue/certifications
 * Lista certificações de modelos
 */
export async function getCertifications(req: Request, res: Response) {
  try {
    logger.info('[getCertifications] Requisição recebida');

    // Validar paginação
    const paginationValidation = payloadValidator.validatePaginationParams(req.query as { page?: string; limit?: string });
    if (!paginationValidation.valid) {
      // 🔍 LOG EXPLÍCITO: Erro de validação para Grafana
      logger.warn('[getCertifications] ❌ Erro de validação de paginação', {
        error: paginationValidation.error,
        query: req.query,
        requestId: (req as AuthenticatedRequest).requestId,
        userId: (req as AuthenticatedRequest).userId
      });
      
      return res.status(400).json(
        ApiResponse.error(paginationValidation.error!, 400)
      );
    }

    const { page, limit } = paginationValidation;
    const { modelId, region, status } = req.query;
    const skip = (page! - 1) * limit!;

    // Construir filtros usando tipo do Prisma
    // Schema v2: modelId foi substituído por deploymentId
    const where: Prisma.ModelCertificationWhereInput = {};
    if (modelId) where.deploymentId = modelId as string;
    if (region) where.region = region as string;
    if (status) where.status = status as Prisma.EnumCertificationStatusFilter;

    // Buscar certificações
    const [certifications, total] = await Promise.all([
      prisma.modelCertification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.modelCertification.count({ where })
    ]);

    // Transformar certificações (converter status para lowercase)
    const transformedCertifications = responseTransformer.transformCertifications(certifications);

    return res.status(200).json(
      ApiResponse.success({
        certifications: transformedCertifications,
        pagination: {
          page: page!,
          limit: limit!,
          total,
          totalPages: Math.ceil(total / limit!)
        }
      })
    );
  } catch (error: unknown) {
    return errorHandler.handleControllerError(error, res, {
      operation: 'getCertifications',
      params: req.query
    });
  }
}

/**
 * GET /api/certification-queue/stats
 * Obtém estatísticas da fila e certificações
 */
export async function getStats(_req: Request, res: Response) {
  try {
    logger.info('[getStats] Requisição recebida');

    // Buscar estatísticas da fila
    const queueStats = await certificationQueueService.getQueueStats();

    // Buscar estatísticas de certificações
    const [certificationsByRegion, certificationsByStatus, recentCertifications] = await Promise.all([
      prisma.modelCertification.groupBy({
        by: ['region', 'status'],
        _count: true
      }),
      prisma.modelCertification.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.modelCertification.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Transformar estatísticas
    const transformedStats = responseTransformer.transformStats({
      queue: queueStats,
      certificationsByRegion,
      certificationsByStatus,
      recentCertifications
    });

    return res.status(200).json(
      ApiResponse.success(transformedStats)
    );
  } catch (error: unknown) {
    return errorHandler.handleControllerError(error, res, {
      operation: 'getStats'
    });
  }
}

/**
 * DELETE /api/certification-queue/jobs/:jobId
 * Cancela um job
 */
export async function cancelJob(req: Request, res: Response) {
  try {
    logger.info('[cancelJob] Requisição recebida');

    // Validar jobId
    const paramValidation = payloadValidator.validateJobIdParam(req.params);
    if (!paramValidation.valid) {
      return res.status(400).json(
        ApiResponse.error(paramValidation.error!, 400)
      );
    }

    const { jobId } = req.params;

    // Cancelar job
    await certificationQueueService.cancelJob(jobId);

    logger.info(`Job cancelled: ${jobId}`);

    return res.status(200).json(
      ApiResponse.success({ jobId })
    );
  } catch (error: unknown) {
    return errorHandler.handleControllerError(error, res, {
      operation: 'cancelJob',
      params: { jobId: req.params.jobId }
    });
  }
}

/**
 * GET /api/certification-queue/regions
 * Lista regiões AWS disponíveis
 */
export async function getAvailableRegions(_req: Request, res: Response) {
  try {
    logger.info('[getAvailableRegions] Requisição recebida');

    // Obter regiões disponíveis
    const regions = regionValidator.getAvailableRegions();

    return res.status(200).json(
      ApiResponse.success(regions)
    );
  } catch (error: unknown) {
    return errorHandler.handleControllerError(error, res, {
      operation: 'getAvailableRegions'
    });
  }
}

/**
 * GET /api/certification-queue/aws-status
 * Verifica status das credenciais AWS configuradas no .env
 */
export async function getAWSStatus(_req: Request, res: Response) {
  try {
    logger.info('[getAWSStatus] Requisição recebida');

    // Verificar status das credenciais AWS
    const status = await awsStatusHandler.checkAWSCredentials();

    return res.status(200).json(
      ApiResponse.success(status)
    );
  } catch (error: unknown) {
    return errorHandler.handleControllerError(error, res, {
      operation: 'getAWSStatus'
    });
  }
}
