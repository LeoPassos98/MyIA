// backend/src/routes/modelsRoutes.ts
// Standards: docs/STANDARDS.md

import { Router, Request, Response } from 'express';
import { ModelRegistry, buildCapabilities } from '../services/ai/registry/model-registry';
import { ModelCapabilities, CachedCapabilities } from '../types/capabilities';
import { logger } from '../utils/logger';
import { jsend } from '../utils/jsend';

const router = Router();

/**
 * Cache in-memory para capabilities
 * TTL: 1 hora (3600000ms)
 */
const capabilitiesCache = new Map<string, CachedCapabilities>();
const CACHE_TTL = 3600000; // 1 hora em milissegundos

/**
 * Limpa entradas expiradas do cache
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [modelId, cached] of capabilitiesCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      capabilitiesCache.delete(modelId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
  }
}

/**
 * GET /api/models/:modelId/capabilities
 * 
 * Retorna as capabilities detalhadas de um modelo específico.
 * Inclui informações sobre parâmetros suportados, limites e valores padrão.
 * 
 * @route GET /api/models/:modelId/capabilities
 * @param modelId - ID do modelo (ex: anthropic.claude-3-5-sonnet-20241022-v2:0)
 * @returns {ModelCapabilities} Capabilities do modelo
 * 
 * @example
 * GET /api/models/anthropic.claude-3-5-sonnet-20241022-v2:0/capabilities
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "temperature": { "enabled": true, "min": 0, "max": 1, "default": 1 },
 *     "topK": { "enabled": false },
 *     "topP": { "enabled": true, "min": 0, "max": 1, "default": 0.999 },
 *     ...
 *   }
 * }
 */
router.get('/:modelId/capabilities', (req: Request, res: Response) => {
  const startTime = Date.now();
  const { modelId: rawModelId } = req.params;

  try {
    logger.info(`[Capabilities] Request for model: ${rawModelId}`);

    // Normaliza o modelId (converte formato frontend para backend)
    const normalizedModelId = ModelRegistry.normalizeModelId(rawModelId);

    if (!normalizedModelId) {
      logger.warn(`[Capabilities] Model not found after normalization: ${rawModelId}`);
      return res.status(404).json(jsend.fail({
        modelId: rawModelId,
        message: `Model '${rawModelId}' not found in registry`,
        hint: 'Use format: provider.model-id (e.g., anthropic.claude-3-5-sonnet-20241022-v2:0)',
        availableModels: ModelRegistry.getAllSupported().map(m => m.modelId),
      }));
    }

    logger.debug(`[Capabilities] Normalized: ${rawModelId} -> ${normalizedModelId}`);

    // Verifica cache primeiro (usa modelId normalizado)
    const cached = capabilitiesCache.get(normalizedModelId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      const elapsed = Date.now() - startTime;
      logger.debug(`[Capabilities] Cache HIT for ${normalizedModelId} (${elapsed}ms)`);
      
      return res.json(jsend.success({
        ...cached.capabilities,
        _meta: {
          cached: true,
          cacheAge: now - cached.timestamp,
          responseTime: elapsed,
          originalModelId: rawModelId,
          normalizedModelId,
        },
      }));
    }

    logger.debug(`[Capabilities] Cache MISS for ${normalizedModelId}`);

    // Busca modelo no registry
    const metadata = ModelRegistry.getModel(normalizedModelId);

    if (!metadata) {
      logger.error(`[Capabilities] Model found during normalization but not in registry: ${normalizedModelId}`);
      return res.status(500).json(jsend.error(
        'Internal error: model normalization inconsistency',
        500,
        { normalizedModelId }
      ));
    }

    // Constrói capabilities
    logger.debug(`[Capabilities] Building capabilities for ${normalizedModelId}`);
    const capabilities = buildCapabilities(metadata);

    // Armazena no cache (usa modelId normalizado)
    capabilitiesCache.set(normalizedModelId, {
      capabilities,
      timestamp: now,
    });

    // Limpa cache expirado periodicamente (a cada 10 requisições)
    if (Math.random() < 0.1) {
      cleanExpiredCache();
    }

    const elapsed = Date.now() - startTime;
    logger.info(`[Capabilities] Built for ${normalizedModelId} (${elapsed}ms)`);

    return res.json(jsend.success({
      ...capabilities,
      _meta: {
        cached: false,
        responseTime: elapsed,
        originalModelId: rawModelId,
        normalizedModelId,
      },
    }));

  } catch (err) {
    const elapsed = Date.now() - startTime;
    logger.error(`[Capabilities] Error for ${rawModelId}:`, err);

    return res.status(500).json(jsend.error(
      'Internal server error while fetching model capabilities',
      500,
      {
        modelId: rawModelId,
        error: err instanceof Error ? err.message : 'Unknown error',
        responseTime: elapsed,
      }
    ));
  }
});

/**
 * GET /api/models/capabilities
 * 
 * Retorna capabilities de todos os modelos suportados.
 * Útil para pré-carregar capabilities no frontend.
 * 
 * @route GET /api/models/capabilities
 * @returns {Object} Mapa de modelId -> capabilities
 */
router.get('/capabilities', (_req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    logger.debug('Fetching capabilities for all models');

    const allModels = ModelRegistry.getAllSupported();
    const capabilitiesMap: Record<string, ModelCapabilities> = {};

    for (const metadata of allModels) {
      // Verifica cache primeiro
      const cached = capabilitiesCache.get(metadata.modelId);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        capabilitiesMap[metadata.modelId] = cached.capabilities;
      } else {
        // Constrói e cacheia
        const capabilities = buildCapabilities(metadata);
        capabilitiesCache.set(metadata.modelId, {
          capabilities,
          timestamp: now,
        });
        capabilitiesMap[metadata.modelId] = capabilities;
      }
    }

    const elapsed = Date.now() - startTime;
    logger.info(`Capabilities fetched for ${allModels.length} models (${elapsed}ms)`);

    return res.json(jsend.success({
      models: capabilitiesMap,
      count: allModels.length,
      _meta: {
        responseTime: elapsed,
        cacheSize: capabilitiesCache.size,
      },
    }));

  } catch (err) {
    const elapsed = Date.now() - startTime;
    logger.error('Error fetching all capabilities:', err);

    return res.status(500).json(jsend.error(
      'Internal server error while fetching capabilities',
      500,
      {
        error: err instanceof Error ? err.message : 'Unknown error',
        responseTime: elapsed,
      }
    ));
  }
});

/**
 * DELETE /api/models/capabilities/cache
 * 
 * Limpa o cache de capabilities (útil para desenvolvimento/debug).
 * 
 * @route DELETE /api/models/capabilities/cache
 * @returns {Object} Resultado da operação
 */
router.delete('/capabilities/cache', (_req: Request, res: Response) => {
  const sizeBefore = capabilitiesCache.size;
  capabilitiesCache.clear();
  
  logger.info(`Cache cleared: ${sizeBefore} entries removed`);

  return res.json(jsend.success({
    message: 'Cache cleared successfully',
    entriesRemoved: sizeBefore,
  }));
});

export default router;
