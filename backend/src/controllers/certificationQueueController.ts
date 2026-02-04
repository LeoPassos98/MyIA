// backend/src/controllers/certificationQueueController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Request, Response } from 'express';
import { certificationQueueService } from '../services/queue/CertificationQueueService';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/api-response';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';

const prisma = new PrismaClient();

/**
 * POST /api/certification-queue/certify-model
 * Certifica um modelo específico em uma região
 */
export async function certifyModel(req: Request, res: Response) {
  try {
    const { modelId, region } = req.body;
    const userId = (req as any).userId;

    if (!modelId || !region) {
      return res.status(400).json(
        ApiResponse.error('modelId and region are required', 400)
      );
    }

    // Verificar se modelo existe
    const model = await prisma.aIModel.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      return res.status(404).json(
        ApiResponse.error('Model not found', 404)
      );
    }

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
  } catch (error: any) {
    logger.error('Error creating certification job:', error);
    return res.status(500).json(
      ApiResponse.error(error.message || 'Failed to create certification job', 500)
    );
  }
}

/**
 * POST /api/certification-queue/certify-multiple
 * Certifica múltiplos modelos em múltiplas regiões
 */
export async function certifyMultipleModels(req: Request, res: Response) {
  try {
    const { modelIds, regions } = req.body;
    const userId = (req as any).userId;

    if (!modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
      return res.status(400).json(
        ApiResponse.error('modelIds must be a non-empty array', 400)
      );
    }

    if (!regions || !Array.isArray(regions) || regions.length === 0) {
      return res.status(400).json(
        ApiResponse.error('regions must be a non-empty array', 400)
      );
    }

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
  } catch (error: any) {
    logger.error('Error creating batch certification job:', error);
    return res.status(500).json(
      ApiResponse.error(error.message || 'Failed to create batch certification job', 500)
    );
  }
}

/**
 * POST /api/certification-queue/certify-all
 * Certifica todos os modelos ativos em regiões específicas
 */
export async function certifyAllModels(req: Request, res: Response) {
  try {
    const { regions } = req.body;
    const userId = (req as any).userId;

    if (!regions || !Array.isArray(regions) || regions.length === 0) {
      return res.status(400).json(
        ApiResponse.error('regions must be a non-empty array', 400)
      );
    }

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
  } catch (error: any) {
    logger.error('Error creating all models certification job:', error);
    return res.status(500).json(
      ApiResponse.error(error.message || 'Failed to create all models certification job', 500)
    );
  }
}

/**
 * GET /api/certification-queue/jobs/:jobId
 * Obtém status de um job específico
 */
export async function getJobStatus(req: Request, res: Response) {
  try {
    const { jobId } = req.params;

    // Validação adicional: verificar se é UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return res.status(400).json(
        ApiResponse.error(`Invalid job ID format. Expected UUID, got: ${jobId}`, 400)
      );
    }

    const status = await certificationQueueService.getJobStatus(jobId);

    if (!status) {
      return res.status(404).json(
        ApiResponse.error(`Job not found with ID: ${jobId}`, 404)
      );
    }

    return res.status(200).json(
      ApiResponse.success(status)
    );
  } catch (error: any) {
    logger.error('Error getting job status:', error);
    
    // Tratamento específico para erros do Prisma
    if (error.code === 'P2023') {
      return res.status(400).json(
        ApiResponse.error('Invalid job ID format', 400)
      );
    }
    
    return res.status(500).json(
      ApiResponse.error(error.message || 'Failed to get job status', 500)
    );
  }
}

/**
 * GET /api/certification-queue/history
 * Lista histórico de jobs de certificação
 */
export async function getJobHistory(req: Request, res: Response) {
  try {
    const { page = '1', limit = '20', status, type } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [jobs, total] = await Promise.all([
      prisma.certificationJob.findMany({
        where,
        skip,
        take,
        include: {
          certifications: {
            // FK para model removido - modelId é referência direta
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.certificationJob.count({ where })
    ]);

    return res.status(200).json(
      ApiResponse.success({
        jobs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take)
        }
      })
    );
  } catch (error: any) {
    logger.error('Error getting job history:', error);
    
    // Tratamento específico para erros de enum inválido
    if (error.code === 'P2006' || error.message?.includes('Invalid enum value')) {
      return res.status(400).json(
        ApiResponse.error(
          `Invalid filter value. Status must be one of: PENDING, QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED, PAUSED. Type must be one of: SINGLE_MODEL, MULTIPLE_MODELS, ALL_MODELS, RECERTIFY`,
          400
        )
      );
    }
    
    return res.status(500).json(
      ApiResponse.error(error.message || 'Failed to get job history', 500)
    );
  }
}

/**
 * GET /api/certification-queue/certifications
 * Lista certificações de modelos
 */
export async function getCertifications(req: Request, res: Response) {
  try {
    const { page = '1', limit = '20', modelId, region, status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};
    if (modelId) where.modelId = modelId;
    if (region) where.region = region;
    if (status) where.status = status;

    // Query sem FK para AIModel (removida do schema)
    const [certifications, total] = await Promise.all([
      prisma.modelCertification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.modelCertification.count({ where })
    ]);

    return res.status(200).json(
      ApiResponse.success({
        certifications,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take)
        }
      })
    );
  } catch (error: any) {
    logger.error('Error getting certifications:', error);
    
    // Tratamento específico para erros de enum inválido
    if (error.code === 'P2006' || error.message?.includes('Invalid enum value')) {
      return res.status(400).json(
        ApiResponse.error(
          `Invalid filter value. Status must be one of: PENDING, QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED`,
          400
        )
      );
    }
    
    // Tratamento específico para UUID inválido
    if (error.code === 'P2023' || error.message?.includes('Invalid UUID')) {
      return res.status(400).json(
        ApiResponse.error('Invalid modelId format. Must be a valid UUID', 400)
      );
    }
    
    return res.status(500).json(
      ApiResponse.error(error.message || 'Failed to get certifications', 500)
    );
  }
}

/**
 * GET /api/certification-queue/stats
 * Obtém estatísticas da fila e certificações
 */
export async function getStats(_req: Request, res: Response) {
  try {
    const queueStats = await certificationQueueService.getQueueStats();

    // Estatísticas de certificações por região
    const certificationsByRegion = await prisma.modelCertification.groupBy({
      by: ['region', 'status'],
      _count: true
    });

    // Estatísticas de certificações por status
    const certificationsByStatus = await prisma.modelCertification.groupBy({
      by: ['status'],
      _count: true
    });

    // Últimas certificações (sem FK para AIModel)
    const recentCertifications = await prisma.modelCertification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(
      ApiResponse.success({
        queue: queueStats,
        certificationsByRegion,
        certificationsByStatus,
        recentCertifications
      })
    );
  } catch (error: any) {
    logger.error('Error getting stats:', error);
    return res.status(500).json(
      ApiResponse.error(error.message || 'Failed to get statistics', 500)
    );
  }
}

/**
 * DELETE /api/certification-queue/jobs/:jobId
 * Cancela um job
 */
export async function cancelJob(req: Request, res: Response) {
  try {
    const { jobId } = req.params;

    await certificationQueueService.cancelJob(jobId);

    logger.info(`Job cancelled: ${jobId}`);

    return res.status(200).json(
      ApiResponse.success({ jobId })
    );
  } catch (error: any) {
    logger.error('Error cancelling job:', error);
    return res.status(500).json(
      ApiResponse.error(error.message || 'Failed to cancel job', 500)
    );
  }
}

/**
 * GET /api/certification-queue/regions
 * Lista regiões AWS disponíveis
 */
export async function getAvailableRegions(_req: Request, res: Response) {
  try {
    // Lista de regiões AWS Bedrock disponíveis
    const regions = [
      { id: 'us-east-1', name: 'US East (N. Virginia)' },
      { id: 'us-west-2', name: 'US West (Oregon)' },
      { id: 'eu-west-1', name: 'Europe (Ireland)' },
      { id: 'eu-central-1', name: 'Europe (Frankfurt)' },
      { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
      { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' }
    ];

    return res.status(200).json(
      ApiResponse.success(regions)
    );
  } catch (error: any) {
    logger.error('Error getting available regions:', error);
    return res.status(500).json(
      ApiResponse.error(error.message || 'Failed to get available regions', 500)
    );
  }
}

/**
 * GET /api/certification-queue/aws-status
 * Verifica status das credenciais AWS configuradas no .env
 * 
 * ⚠️ IMPORTANTE: Este endpoint verifica credenciais de AMBIENTE (.env),
 * não credenciais de usuário. Usado pelo admin para verificar se o
 * sistema está configurado para executar certificações reais.
 */
export async function getAWSStatus(_req: Request, res: Response) {
  try {
    const credentials = process.env.AWS_BEDROCK_CREDENTIALS;
    const region = process.env.AWS_BEDROCK_REGION || 'us-east-1';
    
    // Verificar se credenciais estão configuradas
    if (!credentials) {
      return res.status(200).json(
        ApiResponse.success({
          configured: false,
          valid: false,
          message: 'AWS_BEDROCK_CREDENTIALS não configurado no .env',
          region: null,
          modelsAvailable: 0
        })
      );
    }
    
    // Parsear credenciais (formato: ACCESS_KEY:SECRET_KEY)
    const parts = credentials.split(':');
    if (parts.length !== 2) {
      return res.status(200).json(
        ApiResponse.success({
          configured: true,
          valid: false,
          message: 'Formato inválido de AWS_BEDROCK_CREDENTIALS (esperado: ACCESS_KEY:SECRET_KEY)',
          region,
          modelsAvailable: 0
        })
      );
    }
    
    const [accessKeyId, secretAccessKey] = parts;
    
    // Testar credenciais fazendo chamada real à AWS
    try {
      const client = new BedrockClient({
        region,
        credentials: { accessKeyId, secretAccessKey }
      });
      
      const response = await client.send(new ListFoundationModelsCommand({}));
      const modelsAvailable = response.modelSummaries?.length || 0;
      
      logger.info(`AWS credentials validated successfully. Models available: ${modelsAvailable}`);
      
      return res.status(200).json(
        ApiResponse.success({
          configured: true,
          valid: true,
          message: `Credenciais AWS válidas! ${modelsAvailable} modelos disponíveis.`,
          region,
          modelsAvailable,
          accessKeyPreview: accessKeyId.substring(0, 8) + '...'
        })
      );
    } catch (awsError: any) {
      logger.error('AWS credentials validation failed:', awsError.message);
      
      return res.status(200).json(
        ApiResponse.success({
          configured: true,
          valid: false,
          message: `Erro ao validar credenciais: ${awsError.message}`,
          region,
          modelsAvailable: 0,
          error: awsError.name
        })
      );
    }
  } catch (error: any) {
    logger.error('Error checking AWS status:', error);
    return res.status(500).json(
      ApiResponse.error(error.message || 'Failed to check AWS status', 500)
    );
  }
}
