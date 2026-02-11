// backend/src/controllers/modelsController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../utils/logger';
import {
  baseModelService,
  deploymentService,
  capabilityValidationService
} from '../services/models';
import {
  ListModelsQuery,
  CapabilitiesQuery,
  ProviderModelsQuery,
  GetByIdQuery,
  DeleteQuery
} from '../schemas/modelsSchemas';

/**
 * Controller para operações de BaseModel
 * Responsabilidade: Handlers para rotas /api/v2/models
 */
export const modelsController = {
  /**
   * GET /api/v2/models
   * Lista todos os modelos base com filtros e paginação
   */
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListModelsQuery;

      const result = await baseModelService.findAll(
        { vendor: query.vendor, family: query.family, deprecated: query.deprecated, search: query.search },
        { page: query.page, limit: query.limit, orderBy: query.orderBy, order: query.order, includeDeployments: query.includeDeployments }
      );

      logger.info('GET /api/v2/models', { 
        total: result.pagination.total,
        page: result.pagination.page
      });

      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v2/models/:id
   * Obtém um modelo base por ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const query = req.query as unknown as GetByIdQuery;

      const model = await baseModelService.findById(id, query.includeDeployments);

      if (!model) {
        logger.warn('GET /api/v2/models/:id - Not found', { id });
        res.status(404).json(ApiResponse.fail({ id: 'Model not found' }));
        return;
      }

      logger.info('GET /api/v2/models/:id', { id, name: model.name });
      res.json(ApiResponse.success(model));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v2/models/provider/:providerId
   * Lista modelos disponíveis em um provider específico
   */
  async getByProvider(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { providerId } = req.params;
      const query = req.query as unknown as ProviderModelsQuery;

      const deployments = await deploymentService.findAll(
        { providerId, isActive: query.isActive },
        { page: query.page, limit: query.limit, includeBaseModel: true }
      );

      // Extrair modelos únicos dos deployments
      const modelsMap = new Map();
      deployments.deployments.forEach(d => {
        if (d.baseModel && !modelsMap.has(d.baseModel.id)) {
          modelsMap.set(d.baseModel.id, d.baseModel);
        }
      });

      const models = Array.from(modelsMap.values());

      logger.info('GET /api/v2/models/provider/:providerId', {
        providerId,
        total: models.length
      });

      res.json(ApiResponse.success({
        models,
        pagination: deployments.pagination
      }));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v2/models/capabilities
   * Lista modelos por capabilities específicas
   */
  async getByCapabilities(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as CapabilitiesQuery;

      // Construir lista de capabilities requeridas
      const requiredCapabilities: string[] = [];
      if (query.streaming) requiredCapabilities.push('streaming');
      if (query.vision) requiredCapabilities.push('vision');
      if (query.functionCalling) requiredCapabilities.push('functionCalling');

      // Usar capabilityValidationService para buscar modelos com capabilities específicas
      const models = await capabilityValidationService.findModelsWithAllCapabilities(requiredCapabilities);

      // Aplicar paginação manual
      const startIndex = (query.page - 1) * query.limit;
      const paginatedModels = models.slice(startIndex, startIndex + query.limit);

      logger.info('GET /api/v2/models/capabilities', {
        requiredCapabilities,
        total: models.length,
        returned: paginatedModels.length
      });

      res.json(ApiResponse.success({
        models: paginatedModels,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: models.length,
          totalPages: Math.ceil(models.length / query.limit)
        }
      }));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v2/models
   * Cria um novo modelo base
   */
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const model = await baseModelService.create(req.body);

      logger.info('POST /api/v2/models', {
        id: model.id,
        name: model.name,
        createdBy: req.userId
      });

      res.status(201).json(ApiResponse.success(model));
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json(ApiResponse.fail({ name: error.message }));
        return;
      }
      next(error);
    }
  },

  /**
   * PUT /api/v2/models/:id
   * Atualiza um modelo base existente
   */
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const model = await baseModelService.update(id, req.body);

      if (!model) {
        logger.warn('PUT /api/v2/models/:id - Not found', { id });
        res.status(404).json(ApiResponse.fail({ id: 'Model not found' }));
        return;
      }

      logger.info('PUT /api/v2/models/:id', {
        id: model.id,
        name: model.name,
        updatedBy: req.userId
      });

      res.json(ApiResponse.success(model));
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json(ApiResponse.fail({ name: error.message }));
        return;
      }
      next(error);
    }
  },

  /**
   * DELETE /api/v2/models/:id
   * Remove um modelo base (soft delete por padrão)
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const query = req.query as unknown as DeleteQuery;

      if (query.hard) {
        const deleted = await baseModelService.deleteHard(id);
        if (!deleted) {
          logger.warn('DELETE /api/v2/models/:id (hard) - Not found', { id });
          res.status(404).json(ApiResponse.fail({ id: 'Model not found' }));
          return;
        }
        logger.info('DELETE /api/v2/models/:id', { id, hard: true, deletedBy: req.userId });
        res.json(ApiResponse.success({ deleted: true, id }));
      } else {
        const model = await baseModelService.delete(id, query.replacedBy);
        if (!model) {
          logger.warn('DELETE /api/v2/models/:id (soft) - Not found', { id });
          res.status(404).json(ApiResponse.fail({ id: 'Model not found' }));
          return;
        }
        logger.info('DELETE /api/v2/models/:id', { id, hard: false, deletedBy: req.userId });
        res.json(ApiResponse.success(model));
      }
    } catch (error) {
      next(error);
    }
  }
};
