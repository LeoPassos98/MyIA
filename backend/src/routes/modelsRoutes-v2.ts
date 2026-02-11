// backend/src/routes/modelsRoutes-v2.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Router, Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

// Controllers
import { modelsController } from '../controllers/modelsController';
import { deploymentsController } from '../controllers/deploymentsController';

// Schemas
import {
  // BaseModel schemas
  listBaseModelsSchema,
  getBaseModelByIdSchema,
  getModelsByProviderSchema,
  getModelsByCapabilitiesSchema,
  createBaseModelSchema,
  updateBaseModelSchema,
  deleteBaseModelSchema,
  // Deployment schemas
  listDeploymentsSchema,
  getDeploymentByIdSchema,
  getDeploymentsByModelSchema,
  createDeploymentSchema,
  updateDeploymentSchema,
  deleteDeploymentSchema,
  // Provider schemas
  listProvidersSchema,
  getProviderByIdSchema,
  // Types
  ListProvidersQuery,
  GetByIdQuery
} from '../schemas/modelsSchemas';

// ============================================================================
// ROUTERS
// ============================================================================

const modelsRouter = Router();
const deploymentsRouter = Router();
const providersRouter = Router();

// ============================================================================
// MODELS ROUTES (/api/v2/models)
// ============================================================================

// GET /api/v2/models - Lista todos os modelos base
modelsRouter.get(
  '/',
  validateRequest(listBaseModelsSchema),
  modelsController.list
);

// GET /api/v2/models/capabilities - Lista modelos por capabilities
modelsRouter.get(
  '/capabilities',
  validateRequest(getModelsByCapabilitiesSchema),
  modelsController.getByCapabilities
);

// GET /api/v2/models/provider/:providerId - Lista modelos de um provider
modelsRouter.get(
  '/provider/:providerId',
  validateRequest(getModelsByProviderSchema),
  modelsController.getByProvider
);

// GET /api/v2/models/:id - Obtém um modelo por ID
modelsRouter.get(
  '/:id',
  validateRequest(getBaseModelByIdSchema),
  modelsController.getById
);

// POST /api/v2/models - Cria um novo modelo (requer autenticação)
modelsRouter.post(
  '/',
  authMiddleware,
  validateRequest(createBaseModelSchema),
  modelsController.create
);

// PUT /api/v2/models/:id - Atualiza um modelo (requer autenticação)
modelsRouter.put(
  '/:id',
  authMiddleware,
  validateRequest(updateBaseModelSchema),
  modelsController.update
);

// DELETE /api/v2/models/:id - Remove um modelo (requer autenticação)
modelsRouter.delete(
  '/:id',
  authMiddleware,
  validateRequest(deleteBaseModelSchema),
  modelsController.delete
);

// ============================================================================
// DEPLOYMENTS ROUTES (/api/v2/deployments)
// ============================================================================

// GET /api/v2/deployments - Lista todos os deployments
deploymentsRouter.get(
  '/',
  validateRequest(listDeploymentsSchema),
  deploymentsController.list
);

// GET /api/v2/deployments/active - Lista deployments ativos
deploymentsRouter.get(
  '/active',
  deploymentsController.getActive
);

// GET /api/v2/deployments/model/:modelId - Lista deployments de um modelo
deploymentsRouter.get(
  '/model/:modelId',
  validateRequest(getDeploymentsByModelSchema),
  deploymentsController.getByModel
);

// GET /api/v2/deployments/:id - Obtém um deployment por ID
deploymentsRouter.get(
  '/:id',
  validateRequest(getDeploymentByIdSchema),
  deploymentsController.getById
);

// POST /api/v2/deployments - Cria um novo deployment (requer autenticação)
deploymentsRouter.post(
  '/',
  authMiddleware,
  validateRequest(createDeploymentSchema),
  deploymentsController.create
);

// PUT /api/v2/deployments/:id - Atualiza um deployment (requer autenticação)
deploymentsRouter.put(
  '/:id',
  authMiddleware,
  validateRequest(updateDeploymentSchema),
  deploymentsController.update
);

// DELETE /api/v2/deployments/:id - Remove um deployment (requer autenticação)
deploymentsRouter.delete(
  '/:id',
  authMiddleware,
  validateRequest(deleteDeploymentSchema),
  deploymentsController.delete
);

// ============================================================================
// PROVIDERS ROUTES (/api/v2/providers)
// Nota: Rotas simples mantidas inline (apenas 2 rotas GET)
// ============================================================================

/**
 * GET /api/v2/providers
 * Lista todos os providers
 */
providersRouter.get(
  '/',
  validateRequest(listProvidersSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListProvidersQuery;
      const skip = (query.page - 1) * query.limit;

      // Construir where clause
      const where: Prisma.ProviderWhereInput = {};
      if (query.isActive !== undefined) {
        where.isActive = query.isActive;
      }
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [providers, total] = await Promise.all([
        prisma.provider.findMany({
          where,
          skip,
          take: query.limit,
          orderBy: { name: 'asc' }
        }),
        prisma.provider.count({ where })
      ]);

      const totalPages = Math.ceil(total / query.limit);

      logger.info('GET /api/v2/providers', { total, page: query.page });

      res.json(ApiResponse.success({
        providers,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages
        }
      }));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/providers/:id
 * Obtém um provider por ID
 */
providersRouter.get(
  '/:id',
  validateRequest(getProviderByIdSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const query = req.query as unknown as GetByIdQuery;

      const provider = await prisma.provider.findUnique({
        where: { id },
        include: {
          deployments: query.includeDeployments || false
        }
      });

      if (!provider) {
        logger.warn('GET /api/v2/providers/:id - Not found', { id });
        res.status(404).json(ApiResponse.fail({ id: 'Provider not found' }));
        return;
      }

      logger.info('GET /api/v2/providers/:id', { id, name: provider.name });
      res.json(ApiResponse.success(provider));
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// EXPORTS
// ============================================================================

export { modelsRouter, deploymentsRouter, providersRouter };

/**
 * Função helper para registrar todas as rotas v2 no app Express
 * 
 * @example
 * ```typescript
 * import { registerModelsV2Routes } from './routes/modelsRoutes-v2';
 * registerModelsV2Routes(app);
 * ```
 */
export function registerModelsV2Routes(app: Router): void {
  app.use('/api/v2/models', modelsRouter);
  app.use('/api/v2/deployments', deploymentsRouter);
  app.use('/api/v2/providers', providersRouter);

  logger.info('✅ Models V2 routes registered', {
    routes: ['/api/v2/models', '/api/v2/deployments', '/api/v2/providers']
  });
}

export default {
  modelsRouter,
  deploymentsRouter,
  providersRouter,
  registerModelsV2Routes
};
