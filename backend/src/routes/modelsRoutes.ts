// backend/src/routes/modelsRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * REFATORADO: Clean Slate v2 - Fase 7 (Cleanup)
 * - Removido import de ModelRegistry (legado)
 * - Substituído por modelCacheService e deploymentService
 * - Mantida compatibilidade com API existente
 */

import { Router, Request, Response } from 'express';
import { ModelCapabilities, CachedCapabilities } from '../types/capabilities';
import { logger } from '../utils/logger';
import { jsend } from '../utils/jsend';
import { modelCacheService } from '../services/models';
import { prisma } from '../lib/prisma';

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
 * Busca o provider padrão (bedrock)
 */
async function getDefaultProvider(): Promise<{ id: string; slug: string } | null> {
  const provider = await prisma.provider.findUnique({
    where: { slug: 'bedrock' }
  });
  return provider;
}

/**
 * Normaliza modelId do formato frontend para o formato do banco
 * 
 * Frontend envia: "anthropic:claude-3-5-sonnet-20241022" ou "anthropic.claude-3-5-sonnet-20241022-v2:0"
 * Banco espera: deploymentId (ex: "anthropic.claude-3-5-sonnet-20241022-v2:0")
 */
async function normalizeModelId(rawModelId: string): Promise<string | null> {
  // Converte formato frontend (provider:model) para backend (provider.model)
  const normalizedId = rawModelId.replace(':', '.');
  
  // Buscar provider padrão
  const provider = await getDefaultProvider();
  if (!provider) {
    logger.warn('[normalizeModelId] Default provider (bedrock) not found');
    return null;
  }

  // Tentar buscar deployment exato
  const exactDeployment = await modelCacheService.getDeploymentByDeploymentId(
    provider.id,
    normalizedId,
    true,
    false,
    false
  );
  
  if (exactDeployment) {
    return exactDeployment.deploymentId;
  }

  // Tentar buscar por prefixo (modelo sem versão)
  // Ex: "anthropic.claude-3-5-sonnet-20241022" encontra "anthropic.claude-3-5-sonnet-20241022-v2:0"
  const allDeployments = await modelCacheService.getAllActiveDeployments(true, true);
  
  const prefixMatch = allDeployments.find(d => d.deploymentId.startsWith(normalizedId));
  if (prefixMatch) {
    logger.debug(`Model ID normalized: ${rawModelId} -> ${prefixMatch.deploymentId}`);
    return prefixMatch.deploymentId;
  }

  // Busca por nome similar (remove versões e sufixos)
  const baseModelId = normalizedId.split(':')[0];
  const similarMatch = allDeployments.find(d => {
    const baseDeploymentId = d.deploymentId.split(':')[0];
    return baseDeploymentId.startsWith(baseModelId) || baseModelId.startsWith(baseDeploymentId);
  });

  if (similarMatch) {
    logger.debug(`Model ID normalized (similar): ${rawModelId} -> ${similarMatch.deploymentId}`);
    return similarMatch.deploymentId;
  }

  logger.warn(`Could not normalize model ID: ${rawModelId}`);
  return null;
}

/**
 * Constrói capabilities detalhadas a partir do deployment
 * 
 * Substitui a função buildCapabilities() do model-registry.ts
 */
function buildCapabilitiesFromDeployment(deployment: {
  baseModel: {
    vendor: string;
    capabilities: Record<string, unknown>;
  };
}): ModelCapabilities {
  const vendor = deployment.baseModel.vendor.toLowerCase();
  const caps = deployment.baseModel.capabilities;
  
  logger.debug(`[buildCapabilities] Building for vendor: ${vendor}`);

  // Extrair valores do capabilities do banco
  const streaming = caps.streaming === true;
  const vision = caps.vision === true;
  const functionCalling = caps.functionCalling === true;
  const maxContextWindow = typeof caps.maxContextWindow === 'number' ? caps.maxContextWindow : 128000;
  const maxOutputTokens = typeof caps.maxOutputTokens === 'number' ? caps.maxOutputTokens : 4096;

  // Regras base comuns a todos os modelos
  const baseCapabilities: ModelCapabilities = {
    // Temperature: suportado por todos os vendors
    temperature: {
      enabled: true,
      min: 0,
      max: 1,
      default: vendor === 'anthropic' ? 1 : vendor === 'cohere' ? 0.3 : 0.7,
    },

    // Top-K: NÃO suportado por Anthropic
    topK: {
      enabled: vendor !== 'anthropic',
      min: vendor === 'cohere' ? 0 : 1,
      max: 500,
      default: vendor === 'cohere' ? 0 : 250,
    },

    // Top-P: suportado por todos os vendors
    topP: {
      enabled: true,
      min: 0,
      max: 1,
      default: vendor === 'anthropic' ? 0.999 : vendor === 'cohere' ? 0.75 : 0.9,
    },

    // Max Tokens: suportado por todos
    maxTokens: {
      enabled: true,
      min: 1,
      max: maxOutputTokens,
      default: Math.min(2048, maxOutputTokens),
    },

    // Stop Sequences: suportado por todos
    stopSequences: {
      enabled: true,
      max: vendor === 'anthropic' ? 4 : 10,
    },

    // Streaming: baseado no capabilities
    streaming: {
      enabled: streaming,
    },

    // Vision: baseado no capabilities
    vision: {
      enabled: vision,
    },

    // Function Calling: baseado no capabilities
    functionCalling: {
      enabled: functionCalling,
    },

    // System Prompt: suportado por todos
    systemPrompt: {
      enabled: true,
    },

    // Context Window: do capabilities
    maxContextWindow: maxContextWindow,

    // Max Output Tokens: do capabilities
    maxOutputTokens: maxOutputTokens,

    // Inference Profile: verificar pelo inferenceType do deployment
    requiresInferenceProfile: false, // Será definido pelo caller se necessário
  };

  logger.debug(`[buildCapabilities] Result:`, {
    temperature: baseCapabilities.temperature,
    topK: baseCapabilities.topK,
    topP: baseCapabilities.topP,
    maxTokens: baseCapabilities.maxTokens,
  });

  return baseCapabilities;
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
router.get('/:modelId/capabilities', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { modelId: rawModelId } = req.params;

  try {
    logger.info(`[Capabilities] Request for model: ${rawModelId}`);

    // Normaliza o modelId (converte formato frontend para backend)
    const normalizedModelId = await normalizeModelId(rawModelId);

    if (!normalizedModelId) {
      logger.warn(`[Capabilities] Model not found after normalization: ${rawModelId}`);
      
      // Buscar lista de modelos disponíveis para sugestão
      const allDeployments = await modelCacheService.getAllActiveDeployments(false, false);
      
      return res.status(404).json(jsend.fail({
        modelId: rawModelId,
        message: `Model '${rawModelId}' not found in database`,
        hint: 'Use format: provider.model-id (e.g., anthropic.claude-3-5-sonnet-20241022-v2:0)',
        availableModels: allDeployments.map(d => d.deploymentId),
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

    // Buscar provider padrão
    const provider = await getDefaultProvider();
    if (!provider) {
      return res.status(500).json(jsend.error(
        'Default provider (bedrock) not configured',
        500
      ));
    }

    // Busca deployment no cache/banco
    const deployment = await modelCacheService.getDeploymentByDeploymentId(
      provider.id,
      normalizedModelId,
      true, // includeBaseModel
      false, // includeProvider
      false // includeCertifications
    );

    if (!deployment) {
      logger.error(`[Capabilities] Deployment found during normalization but not in cache: ${normalizedModelId}`);
      return res.status(500).json(jsend.error(
        'Internal error: model normalization inconsistency',
        500,
        { normalizedModelId }
      ));
    }

    // Constrói capabilities
    logger.debug(`[Capabilities] Building capabilities for ${normalizedModelId}`);
    const capabilities = buildCapabilitiesFromDeployment({
      baseModel: {
        vendor: deployment.baseModel.vendor,
        capabilities: deployment.baseModel.capabilities as Record<string, unknown>,
      }
    });

    // Verificar se requer inference profile
    capabilities.requiresInferenceProfile = deployment.inferenceType === 'INFERENCE_PROFILE';

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
router.get('/capabilities', async (_req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    logger.debug('Fetching capabilities for all models');

    // Buscar todos os deployments ativos
    const allDeployments = await modelCacheService.getAllActiveDeployments(true, false);
    const capabilitiesMap: Record<string, ModelCapabilities> = {};

    for (const deployment of allDeployments) {
      const modelId = deployment.deploymentId;
      
      // Verifica cache primeiro
      const cached = capabilitiesCache.get(modelId);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        capabilitiesMap[modelId] = cached.capabilities;
      } else {
        // Constrói e cacheia
        const capabilities = buildCapabilitiesFromDeployment({
          baseModel: {
            vendor: deployment.baseModel.vendor,
            capabilities: deployment.baseModel.capabilities as Record<string, unknown>,
          }
        });
        
        // Verificar se requer inference profile
        capabilities.requiresInferenceProfile = deployment.inferenceType === 'INFERENCE_PROFILE';
        
        capabilitiesCache.set(modelId, {
          capabilities,
          timestamp: now,
        });
        capabilitiesMap[modelId] = capabilities;
      }
    }

    const elapsed = Date.now() - startTime;
    logger.info(`Capabilities fetched for ${allDeployments.length} models (${elapsed}ms)`);

    return res.json(jsend.success({
      models: capabilitiesMap,
      count: allDeployments.length,
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
  
  // Também invalida o cache do modelCacheService
  modelCacheService.invalidateAll();
  
  logger.info(`Cache cleared: ${sizeBefore} entries removed`);

  return res.json(jsend.success({
    message: 'Cache cleared successfully',
    entriesRemoved: sizeBefore,
  }));
});

export default router;
