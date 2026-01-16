// backend/src/routes/providers.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { jsend } from '../utils/jsend';
import { protect } from '../middleware/auth';
import { providersController } from '../controllers/providersController';
import { validateRequest } from '../middleware/validateRequest';
import { apiLimiter } from '../middleware/rateLimiter'; // Corrigido: usar apiLimiter
import { bedrockConfigSchema } from '../schemas/bedrockSchema';

const router = Router();

router.get('/bedrock/models', protect, async (_req, res: Response, next: NextFunction) => {
  try {
    const models = await prisma.aIModel.findMany({
      where: {
        provider: {
          slug: 'bedrock',
          isActive: true
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        apiModelId: true,
        costPer1kInput: true,
        costPer1kOutput: true,
        contextWindow: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(jsend.success({ models }));
  } catch (error) {
    next(error);
  }
});

// Endpoint para buscar modelos disponíveis na AWS do usuário
router.get('/bedrock/available-models', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await providersController.getAvailableModels(req as any, res);
  } catch (error) {
    next(error);
  }
});

// Endpoint para listar providers configurados pelo usuário
router.get('/configured', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    // Buscar configurações do usuário
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    // Buscar validação AWS
    const awsValidation = await prisma.providerCredentialValidation.findUnique({
      where: { userId_provider: { userId, provider: 'bedrock' } }
    });

    // Buscar todos os providers ativos
    const allProviders = await prisma.aIProvider.findMany({
      where: { isActive: true },
      include: { models: { where: { isActive: true } } },
      orderBy: { name: 'asc' }
    });

    // Filtrar providers baseado em configuração
    const configuredProviders = allProviders.filter(provider => {
      // Providers padrão (sempre disponíveis)
      if (['openai', 'groq', 'together'].includes(provider.slug)) {
        return true;
      }

      // AWS Bedrock: só mostrar se validado
      if (provider.slug === 'bedrock') {
        if (awsValidation?.status === 'valid' && settings?.awsEnabledModels?.length) {
          // Criar modelos dinâmicos para IDs que não existem no banco
          const existingModels = provider.models.filter(m =>
            settings.awsEnabledModels.includes(m.apiModelId)
          );
          
          // Para modelos que não estão no banco, criar objetos dinâmicos
          const missingModelIds = settings.awsEnabledModels.filter(
            (modelId: string) => !provider.models.some(m => m.apiModelId === modelId)
          );
          
          const dynamicModels = missingModelIds.map((apiModelId: string) => ({
            id: `dynamic-${apiModelId}`,
            name: apiModelId.split('.').pop()?.replace(/-/g, ' ').toUpperCase() || apiModelId,
            apiModelId,
            contextWindow: 200000, // Default para modelos novos
            costPer1kInput: 0,
            costPer1kOutput: 0,
            isActive: true,
            providerId: provider.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }));
          
          provider.models = [...existingModels, ...dynamicModels];
          
          console.log('✅ [Bedrock] Modelos configurados:', provider.models.length);
          console.log('  - Do banco:', existingModels.length);
          console.log('  - Dinâmicos:', dynamicModels.length);
          
          return provider.models.length > 0;
        }
        return false;
      }

      return true;
    });

    res.json(jsend.success({ providers: configuredProviders }));
  } catch (error) {
    next(error);
  }
});

router.post(
  '/bedrock/validate',
  protect,
  apiLimiter, // Corrigido: usar apiLimiter do rateLimiter.ts
  validateRequest(bedrockConfigSchema),
  providersController.validateAWS
);

export default router;
