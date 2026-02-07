// backend/src/controllers/providersController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { jsend } from '../utils/jsend';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import {
  AWSCredentialsService,
  AWSModelsService,
  VendorAggregationService,
  ModelRatingService
} from '../services/providers';

// Instanciar services
const awsCredentialsService = new AWSCredentialsService();
const awsModelsService = new AWSModelsService(awsCredentialsService);
const vendorAggregationService = new VendorAggregationService();
const modelRatingService = new ModelRatingService();

function isError(obj: unknown): obj is Error {
  return typeof obj === 'object' && obj !== null && 'message' in obj;
}

export const providersController = {
  /**
   * POST /api/providers/bedrock/validate
   * Validação inteligente (Safe-Save) para credenciais AWS Bedrock
   */
  async validateAWS(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      if (!userId) {
        return res.status(401).json(jsend.fail({ auth: 'Não autorizado' }));
      }

      logger.info('Iniciando validação AWS Bedrock', {
        requestId: req.id,
        userId,
        hasAccessKey: !!req.body.accessKey,
        accessKeyLength: req.body.accessKey?.length,
        hasSecretKey: !!req.body.secretKey,
        region: req.body.region,
        useStoredCredentials: req.body.useStoredCredentials
      });

      const result = await awsCredentialsService.validateCredentials(
        userId,
        req.body,
        req.id
      );

      logger.info('AWS Bedrock validation success', {
        requestId: req.id,
        userId,
        latencyMs: result.latencyMs
      });

      return res.json(jsend.success({
        status: 'valid',
        message: result.message,
        latencyMs: result.latencyMs,
        modelsCount: result.modelsCount
      }));

    } catch (error) {
      // Se for erro de validação Zod, exibir detalhes
      if (error?.constructor?.name === 'ZodError') {
        const zodError = error as { errors: unknown[] };
        logger.warn('Erro de validação Zod na validação AWS', {
          requestId: req.id,
          userId: req.userId,
          errors: zodError.errors
        });
        return res.status(400).json(jsend.fail({
          validation: 'Dados inválidos',
          errors: zodError.errors
        }));
      }
      
      if (error instanceof AppError) {
        throw error;
      }
      const err = isError(error) ? error : new Error(String(error));
      
      logger.error('Erro inesperado na validação AWS Bedrock', {
        requestId: req.id,
        userId: req.userId,
        error: err.message,
        stack: err.stack,
      });
      return res.status(500).json(jsend.error('Erro interno na validação AWS', 500));
    }
  },

  /**
   * GET /api/providers/bedrock/available-models
   * Retorna os modelos disponíveis na conta AWS do usuário
   */
  async getAvailableModels(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      
      logger.info('Iniciando busca de modelos AWS disponíveis', {
        requestId: req.id,
        userId
      });
      
      if (!userId) {
        logger.warn('Usuário não autorizado ao buscar modelos AWS', {
          requestId: req.id
        });
        return res.status(401).json(jsend.fail({ auth: 'Não autorizado' }));
      }

      const models = await awsModelsService.getAvailableModels(userId, req.id);
      
      logger.info('Modelos AWS Bedrock obtidos', {
        requestId: req.id,
        userId,
        totalModels: models.length
      });

      return res.json(jsend.success({
        models,
        totalCount: models.length
      }));

    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      
      const err = isError(error) ? error : new Error(String(error));
      
      logger.error('Erro ao buscar modelos AWS Bedrock', {
        requestId: req.id,
        userId: req.userId,
        error: err.message,
        stack: err.stack,
      });
      
      return res.status(500).json(jsend.error('Erro ao buscar modelos AWS', 500));
    }
  },

  /**
   * GET /api/providers/by-vendor
   * Retorna modelos agrupados por vendor com disponibilidade em múltiplos providers
   */
  async getByVendor(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      
      logger.info('Iniciando busca de vendors', {
        requestId: req.id,
        userId
      });
      
      const vendors = await vendorAggregationService.getVendorsWithModels(userId, req.id);
      
      logger.info('Vendors obtidos com sucesso', {
        requestId: req.id,
        userId,
        totalVendors: vendors.length
      });
      
      return res.status(200).json(jsend.success({ vendors }));
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      const err = isError(error) ? error : new Error(String(error));
      logger.error('Erro ao buscar vendors', {
        requestId: req.id,
        userId: req.userId,
        error: err.message,
        stack: err.stack,
      });
      return res.status(500).json(jsend.error('Erro ao buscar vendors', 500));
    }
  },

  /**
   * GET /api/providers/models
   * Retorna todos os modelos configurados em formato flat com rating
   */
  async getModelsWithRating(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      
      logger.info('Iniciando busca de modelos com rating', {
        requestId: req.id,
        userId
      });
      
      const models = await modelRatingService.getModelsWithRating(userId, req.id);
      
      logger.info('Modelos com rating obtidos', {
        requestId: req.id,
        userId,
        totalModels: models.length
      });
      
      return res.status(200).json(jsend.success({ data: models }));
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      const err = isError(error) ? error : new Error(String(error));
      logger.error('Erro ao buscar modelos com rating', {
        requestId: req.id,
        userId: req.userId,
        error: err.message,
        stack: err.stack,
      });
      return res.status(500).json(jsend.error('Erro ao buscar modelos', 500));
    }
  }
};
