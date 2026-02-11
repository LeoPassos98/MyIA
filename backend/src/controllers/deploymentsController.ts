// backend/src/controllers/deploymentsController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../utils/logger';
import { deploymentService } from '../services/models';
import {
  ListDeploymentsQuery,
  DeploymentByIdQuery,
  DeploymentsByModelQuery,
  DeleteDeploymentQuery
} from '../schemas/modelsSchemas';

/**
 * Controller para operações de Deployment
 * Responsabilidade: Handlers para rotas /api/v2/deployments
 */
export const deploymentsController = {
  /**
   * GET /api/v2/deployments
   * Lista todos os deployments com filtros e paginação
   */
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListDeploymentsQuery;

      const result = await deploymentService.findAll(
        { baseModelId: query.baseModelId, providerId: query.providerId, inferenceType: query.inferenceType, isActive: query.isActive, search: query.search },
        { page: query.page, limit: query.limit, orderBy: query.orderBy, order: query.order, includeBaseModel: query.includeBaseModel, includeProvider: query.includeProvider, includeCertifications: query.includeCertifications }
      );

      logger.info('GET /api/v2/deployments', {
        total: result.pagination.total,
        page: result.pagination.page
      });

      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v2/deployments/:id
   * Obtém um deployment por ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const query = req.query as unknown as DeploymentByIdQuery;

      const deployment = await deploymentService.findById(
        id,
        query.includeBaseModel || false,
        query.includeProvider || false,
        query.includeCertifications || false
      );

      if (!deployment) {
        logger.warn('GET /api/v2/deployments/:id - Not found', { id });
        res.status(404).json(ApiResponse.fail({ id: 'Deployment not found' }));
        return;
      }

      logger.info('GET /api/v2/deployments/:id', { id, deploymentId: deployment.deploymentId });
      res.json(ApiResponse.success(deployment));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v2/deployments/model/:modelId
   * Lista deployments de um modelo específico
   */
  async getByModel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { modelId } = req.params;
      const query = req.query as unknown as DeploymentsByModelQuery;

      const result = await deploymentService.findAll(
        { baseModelId: modelId, isActive: query.isActive },
        { page: query.page, limit: query.limit, includeBaseModel: true, includeProvider: query.includeProvider }
      );

      logger.info('GET /api/v2/deployments/model/:modelId', { modelId, total: result.pagination.total });
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v2/deployments/active
   * Lista apenas deployments ativos
   */
  async getActive(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await deploymentService.findAll(
        { isActive: true },
        { includeBaseModel: true, includeProvider: true }
      );

      logger.info('GET /api/v2/deployments/active', { total: result.pagination.total });
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v2/deployments
   * Cria um novo deployment
   */
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deployment = await deploymentService.create(req.body);

      logger.info('POST /api/v2/deployments', {
        id: deployment.id,
        deploymentId: deployment.deploymentId,
        createdBy: req.userId
      });

      res.status(201).json(ApiResponse.success(deployment));
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json(ApiResponse.fail({ deploymentId: error.message }));
        return;
      }
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('does not exist'))) {
        res.status(400).json(ApiResponse.fail({ reference: error.message }));
        return;
      }
      next(error);
    }
  },

  /**
   * PUT /api/v2/deployments/:id
   * Atualiza um deployment existente
   */
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deployment = await deploymentService.update(id, req.body);

      if (!deployment) {
        logger.warn('PUT /api/v2/deployments/:id - Not found', { id });
        res.status(404).json(ApiResponse.fail({ id: 'Deployment not found' }));
        return;
      }

      logger.info('PUT /api/v2/deployments/:id', {
        id: deployment.id,
        deploymentId: deployment.deploymentId,
        updatedBy: req.userId
      });

      res.json(ApiResponse.success(deployment));
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json(ApiResponse.fail({ deploymentId: error.message }));
        return;
      }
      next(error);
    }
  },

  /**
   * DELETE /api/v2/deployments/:id
   * Remove um deployment (soft delete por padrão)
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const query = req.query as unknown as DeleteDeploymentQuery;

      if (query.hard) {
        const deleted = await deploymentService.deleteHard(id);
        if (!deleted) {
          logger.warn('DELETE /api/v2/deployments/:id (hard) - Not found', { id });
          res.status(404).json(ApiResponse.fail({ id: 'Deployment not found' }));
          return;
        }
        logger.info('DELETE /api/v2/deployments/:id', { id, hard: true, deletedBy: req.userId });
        res.json(ApiResponse.success({ deleted: true, id }));
      } else {
        const deployment = await deploymentService.delete(id);
        if (!deployment) {
          logger.warn('DELETE /api/v2/deployments/:id (soft) - Not found', { id });
          res.status(404).json(ApiResponse.fail({ id: 'Deployment not found' }));
          return;
        }
        logger.info('DELETE /api/v2/deployments/:id', { id, hard: false, deletedBy: req.userId });
        res.json(ApiResponse.success(deployment));
      }
    } catch (error) {
      next(error);
    }
  }
};
