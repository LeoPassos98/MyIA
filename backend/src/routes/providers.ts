// backend/src/routes/providers.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { jsend } from '../utils/jsend';
import { protect } from '../middleware/authMiddleware';
import { providersController } from '../controllers/providersController';
import { validateRequest } from '../middleware/validateRequest';
import { apiLimiter } from '../middleware/rateLimiter'; // Corrigido: usar apiLimiter
import { bedrockConfigSchema } from '../schemas/bedrockSchema';
import logger from '../utils/logger';

const router = Router();

router.get('/bedrock/models', protect, async (_req, res: Response, next: NextFunction) => {
  try {
    // Schema v2: Usar modelDeployment com join para baseModel e provider
    const deployments = await prisma.modelDeployment.findMany({
      where: {
        provider: {
          slug: 'bedrock',
          isActive: true
        },
        isActive: true
      },
      include: {
        baseModel: {
          select: {
            id: true,
            name: true,
            capabilities: true
          }
        }
      },
      orderBy: { baseModel: { name: 'asc' } }
    });

    // Mapear para formato compatível com frontend
    const models = deployments.map(d => {
      const capabilities = d.baseModel.capabilities as Record<string, unknown> | null;
      return {
        id: d.id,
        name: d.baseModel.name,
        apiModelId: d.deploymentId, // deploymentId é o equivalente ao apiModelId
        costPer1kInput: d.costPer1MInput / 1000, // Converter de 1M para 1k
        costPer1kOutput: d.costPer1MOutput / 1000,
        contextWindow: (capabilities?.maxContextWindow as number) || 200000
      };
    });

    res.json(jsend.success({ models }));
  } catch (error) {
    next(error);
  }
});

// Endpoint para buscar modelos disponíveis na AWS do usuário
router.get('/bedrock/available-models', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await providersController.getAvailableModels(req, res);
  } catch (error) {
    next(error);
  }
});

// Endpoint para listar providers configurados pelo usuário
// Schema v2: Usa Provider + ModelDeployment (não mais AIProvider + AIModel)
router.get('/configured', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    logger.info(`\n🔍 [/providers/configured] Usuário: ${userId}`);

    // Buscar configurações do usuário
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    logger.info(`📊 [Settings] awsEnabledModels:`, settings?.awsEnabledModels);
    logger.info(`📊 [Settings] awsRegion:`, settings?.awsRegion);

    // Schema v2: ProviderCredentialValidation foi removido
    // Verificar credenciais AWS diretamente nas settings
    const hasAwsCredentials = !!(settings?.awsAccessKey && settings?.awsSecretKey);
    const hasEnabledModels = (settings?.awsEnabledModels?.length ?? 0) > 0;

    logger.info(`🔐 [Validation] hasAwsCredentials:`, hasAwsCredentials);
    logger.info(`🔐 [Validation] hasEnabledModels:`, hasEnabledModels);

    // Schema v2: Buscar providers ativos com deployments
    const allProviders = await prisma.provider.findMany({
      where: { isActive: true },
      include: {
        deployments: {
          where: { isActive: true },
          include: {
            baseModel: {
              select: {
                id: true,
                name: true,
                capabilities: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    logger.info(`📦 [Providers] Total ativos: ${allProviders.length}`);

    // Transformar para formato compatível com frontend
    const configuredProviders = allProviders
      .filter(provider => {
        // Providers padrão (sempre disponíveis)
        if (['openai', 'groq', 'together'].includes(provider.slug)) {
          logger.info(`✅ [${provider.slug}] Provider padrão incluído`);
          return true;
        }

        // AWS Bedrock: só mostrar se tem credenciais e modelos habilitados
        if (provider.slug === 'bedrock') {
          logger.info(`\n🔍 [Bedrock] Verificando condições...`);
          logger.info(`   - Credenciais AWS: ${hasAwsCredentials}`);
          logger.info(`   - Modelos habilitados: ${settings?.awsEnabledModels?.length || 0}`);
          
          if (hasAwsCredentials && hasEnabledModels) {
            logger.info('✅ [Bedrock] Condições atendidas');
            return true;
          }
          logger.info('❌ [Bedrock] Condições não atendidas, provider excluído');
          return false;
        }

        return true;
      })
      .map(provider => {
        // Mapear deployments para formato de models (compatibilidade com frontend)
        const models = provider.deployments
          .filter(d => {
            // Para Bedrock, filtrar apenas modelos habilitados pelo usuário
            if (provider.slug === 'bedrock' && settings?.awsEnabledModels) {
              return settings.awsEnabledModels.includes(d.deploymentId);
            }
            return true;
          })
          .map(d => {
            const capabilities = d.baseModel.capabilities as Record<string, unknown> | null;
            return {
              id: d.id,
              name: d.baseModel.name,
              apiModelId: d.deploymentId,
              contextWindow: (capabilities?.maxContextWindow as number) || 200000,
              costPer1kInput: d.costPer1MInput / 1000,
              costPer1kOutput: d.costPer1MOutput / 1000,
              isActive: d.isActive,
              providerId: d.providerId,
              createdAt: d.createdAt,
              updatedAt: d.updatedAt
            };
          });

        // Para Bedrock, adicionar modelos dinâmicos que não estão no banco
        if (provider.slug === 'bedrock' && settings?.awsEnabledModels) {
          const existingModelIds = models.map(m => m.apiModelId);
          const missingModelIds = settings.awsEnabledModels.filter(
            (modelId: string) => !existingModelIds.includes(modelId)
          );
          
          const dynamicModels = missingModelIds.map((apiModelId: string) => ({
            id: `dynamic-${apiModelId}`,
            name: apiModelId.split('.').pop()?.replace(/-/g, ' ').toUpperCase() || apiModelId,
            apiModelId,
            contextWindow: 200000,
            costPer1kInput: 0,
            costPer1kOutput: 0,
            isActive: true,
            providerId: provider.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }));
          
          models.push(...dynamicModels);
          
          logger.info('✅ [Bedrock] Modelos configurados:', models.length);
          logger.info('  - Do banco:', models.length - dynamicModels.length);
          logger.info('  - Dinâmicos:', dynamicModels.length);
        }

        return {
          id: provider.id,
          name: provider.name,
          slug: provider.slug,
          type: provider.type,
          isActive: provider.isActive,
          models
        };
      });

    logger.info(`\n✅ [Final] Providers configurados: ${configuredProviders.length}`);
    logger.info(`   Slugs: ${configuredProviders.map(p => p.slug).join(', ')}\n`);

    res.json(jsend.success({ providers: configuredProviders }));
  } catch (error) {
    next(error);
  }
});

// GET /api/providers/models
router.get(
  '/models',
  protect,
  apiLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await providersController.getModelsWithRating(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/providers/by-vendor
router.get(
  '/by-vendor',
  protect,
  apiLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await providersController.getByVendor(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/bedrock/validate',
  protect,
  apiLimiter, // Corrigido: usar apiLimiter do rateLimiter.ts
  validateRequest(bedrockConfigSchema),
  providersController.validateAWS
);

export default router;
