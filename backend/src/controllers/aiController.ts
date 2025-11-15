// backend/src/controllers/aiController.ts

import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai';
import { ProviderName } from '../services/ai/types';
import { logger } from '../utils/logger';

export const aiController = {
  // GET /api/ai/providers - Listar todos os providers
  async listProviders(_req: Request, res: Response, next: NextFunction) {
    try {
      const providers = aiService.getConfiguredProviders();
      
      logger.info('Providers list requested');
      
      res.status(200).json({
        providers,
        total: providers.length,
        configured: providers.filter(p => p.isConfigured).length, // <-- CORRIGIDO
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/ai/test/:provider - Testar conexão com um provider
  async testProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;

      // Validar se o provider existe
      const validProviders: ProviderName[] = ['openai', 'groq', 'together', 'perplexity', 'mistral', 'claude'];

      if (!validProviders.includes(provider as ProviderName)) {
        return res.status(400).json({
          error: `Invalid provider. Valid options: ${validProviders.join(', ')}`,
        });
      }

      logger.info(`Testing provider: ${provider}`);
      
      const result = await aiService.testProvider(provider as ProviderName);
      
      return res.json(result);
    } catch (error) {
      next(error);
      return;
    }
  },
};