// backend/src/services/ai/adapters/adapter-factory.ts
// Standards: docs/STANDARDS.md

/**
 * @file adapter-factory.ts
 * @description Factory para criar adapters baseado em vendor e inference type
 * @module services/ai/adapters
 */

import { BaseModelAdapter } from './base.adapter';
import { InferenceType } from '../types';
import { logger } from '../../../utils/logger';
import { ModelRegistry } from '../registry/model-registry';

// Adapters antigos (ON_DEMAND)
import { AnthropicAdapter } from './anthropic.adapter';
import { AmazonAdapter } from './amazon.adapter';
import { CohereAdapter } from './cohere.adapter';

// Adapters novos (INFERENCE_PROFILE)
import { AnthropicProfileAdapter, AmazonProfileAdapter } from './inference-profile';

/**
 * Feature flag para migração gradual (verificação dinâmica para suportar testes)
 */
function isUseNewAdapters(): boolean {
  return process.env.USE_NEW_ADAPTERS === 'true';
}

/**
 * Mapa de adapters por vendor e inference type
 */
const adapterMap: Record<string, Record<InferenceType, new () => BaseModelAdapter>> = {
  anthropic: {
    ON_DEMAND: AnthropicAdapter,
    INFERENCE_PROFILE: AnthropicProfileAdapter,
    PROVISIONED: AnthropicAdapter, // Fallback
    CROSS_REGION: AnthropicAdapter // Fallback
  },
  amazon: {
    ON_DEMAND: AmazonAdapter,
    INFERENCE_PROFILE: AmazonProfileAdapter,
    PROVISIONED: AmazonAdapter,
    CROSS_REGION: AmazonAdapter
  },
  cohere: {
    ON_DEMAND: CohereAdapter,
    INFERENCE_PROFILE: CohereAdapter, // Cohere não suporta profiles
    PROVISIONED: CohereAdapter,
    CROSS_REGION: CohereAdapter
  }
};

/**
 * Factory para criar adapters
 */
export class AdapterFactory {
  private static adapters: Map<string, BaseModelAdapter> = new Map();
  private static allAdapters: BaseModelAdapter[] | null = null;

  /**
   * Cria adapter apropriado baseado em vendor e inference type
   */
  static createAdapter(vendor: string, inferenceType: InferenceType = 'ON_DEMAND'): BaseModelAdapter {
    const useNewAdapters = isUseNewAdapters();
    logger.info('🏭 [AdapterFactory] Creating adapter', { 
      vendor, 
      inferenceType, 
      useNewAdapters,
      env_USE_NEW_ADAPTERS: process.env.USE_NEW_ADAPTERS 
    });

    // Se feature flag desabilitada, usar adapters antigos
    if (!useNewAdapters) {
      logger.warn('⚠️ [AdapterFactory] USE_NEW_ADAPTERS is not enabled, using legacy adapters. ' +
        'This may cause issues with Claude 4.x models that require Inference Profiles. ' +
        'Set USE_NEW_ADAPTERS=true in .env to enable modern adapters.');
      return this.createLegacyAdapter(vendor);
    }

    // Buscar adapter no mapa
    const vendorAdapters = adapterMap[vendor.toLowerCase()];
    if (!vendorAdapters) {
      logger.warn(`No adapters found for vendor: ${vendor}, using legacy`);
      return this.createLegacyAdapter(vendor);
    }

    const AdapterClass = vendorAdapters[inferenceType];
    if (!AdapterClass) {
      logger.warn(`No adapter found for ${vendor}/${inferenceType}, using ON_DEMAND`);
      return new vendorAdapters.ON_DEMAND();
    }

    logger.info(`Using adapter: ${vendor}/${inferenceType}`);
    return new AdapterClass();
  }

  /**
   * Cria adapter legado (compatibilidade)
   */
  private static createLegacyAdapter(vendor: string): BaseModelAdapter {
    switch (vendor.toLowerCase()) {
      case 'anthropic':
        return new AnthropicAdapter();
      case 'amazon':
        return new AmazonAdapter();
      case 'cohere':
        return new CohereAdapter();
      default:
        throw new Error(`Unsupported vendor: ${vendor}`);
    }
  }

  /**
   * Detecta inference type de um modelId
   * Consulta o registry para verificar platformRules
   */
  static detectInferenceType(modelId: string): InferenceType {
    // 1. Verificar formato do modelId primeiro (mais rápido)
    // Inference Profile: {region}.{vendor}.{model}
    if (/^(us|eu|apac)\.[a-z]+\./i.test(modelId)) {
      return 'INFERENCE_PROFILE';
    }

    // Provisioned: arn:aws:bedrock:...
    if (modelId.startsWith('arn:aws:bedrock')) {
      return 'PROVISIONED';
    }

    // 2. Consultar registry para verificar platformRules
    try {
      const metadata = ModelRegistry.getModel(modelId);
      if (metadata?.platformRules) {
        const bedrockRule = metadata.platformRules.find(rule => rule.platform === 'bedrock');
        if (bedrockRule?.rule === 'requires_inference_profile') {
          logger.debug(`Model ${modelId} requires INFERENCE_PROFILE per registry rules`);
          return 'INFERENCE_PROFILE';
        }
      }
    } catch (error) {
      // Se modelo não está no registry, continuar com detecção por formato
      logger.debug(`Model ${modelId} not found in registry, using format-based detection`);
    }

    // 3. Default: ON_DEMAND
    return 'ON_DEMAND';
  }

  /**
   * Get adapter for a specific vendor (Legacy method - mantido para compatibilidade)
   * 
   * @deprecated Use createAdapter(vendor, inferenceType) instead
   * @param vendor - Vendor name (e.g., 'anthropic', 'cohere', 'amazon')
   * @returns Adapter instance
   * @throws Error if vendor not supported
   */
  static getAdapter(vendor: string): BaseModelAdapter {
    const normalizedVendor = vendor.toLowerCase();

    // Return cached adapter if exists
    if (this.adapters.has(normalizedVendor)) {
      return this.adapters.get(normalizedVendor)!;
    }

    // Create new adapter using legacy method
    const adapter = this.createLegacyAdapter(normalizedVendor);

    // Cache and return
    this.adapters.set(normalizedVendor, adapter);
    return adapter;
  }

  /**
   * Get adapter for a specific model ID
   * 
   * Searches all adapters to find one that supports the model.
   * 
   * @param modelId - Model ID to find adapter for
   * @returns Adapter instance
   * @throws Error if no adapter supports the model
   */
  static getAdapterForModel(modelId: string): BaseModelAdapter {
    // Detectar inference type e vendor
    const inferenceType = this.detectInferenceType(modelId);
    const vendor = this.detectVendor(modelId);

    if (vendor) {
      try {
        return this.createAdapter(vendor, inferenceType);
      } catch (error) {
        logger.warn(`Failed to create adapter for ${vendor}/${inferenceType}, falling back to search`, { error });
      }
    }

    // Fallback: buscar em todos os adapters (comportamento legado)
    // Initialize all adapters if not done yet
    if (!this.allAdapters) {
      this.allAdapters = [
        this.getAdapter('anthropic'),
        this.getAdapter('cohere'),
        this.getAdapter('amazon'),
      ];
    }

    // Find adapter that supports this model
    for (const adapter of this.allAdapters) {
      if (adapter.supportsModel(modelId)) {
        return adapter;
      }
    }

    throw new Error(`No adapter found for model: ${modelId}`);
  }

  /**
   * Detect vendor from model ID
   * 
   * @param modelId - Model ID
   * @returns Vendor name or null if not detected
   */
  static detectVendor(modelId: string): string | null {
    // Inference Profile format: {region}.{vendor}.{model}
    const inferenceProfileMatch = modelId.match(/^(us|eu|apac)\.([a-z]+)\./i);
    if (inferenceProfileMatch) {
      return inferenceProfileMatch[2].toLowerCase();
    }

    // Standard format: {vendor}.{model}
    const prefix = modelId.split('.')[0].toLowerCase();
    
    // Check if prefix matches a known vendor
    const knownVendors = ['anthropic', 'cohere', 'amazon', 'ai21', 'meta', 'mistral'];
    
    if (knownVendors.includes(prefix)) {
      return prefix;
    }

    // Check for direct API format (e.g., 'claude-3-5-sonnet')
    if (modelId.startsWith('claude-')) {
      return 'anthropic';
    }
    
    if (modelId.startsWith('command-')) {
      return 'cohere';
    }

    return null;
  }

  /**
   * Check if a model is supported
   * 
   * @param modelId - Model ID to check
   * @returns true if supported
   */
  static isModelSupported(modelId: string): boolean {
    try {
      this.getAdapterForModel(modelId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all registered adapters
   * 
   * @returns Array of all adapter instances
   */
  static getAllAdapters(): BaseModelAdapter[] {
    if (!this.allAdapters) {
      this.allAdapters = [
        this.getAdapter('anthropic'),
        this.getAdapter('cohere'),
        this.getAdapter('amazon'),
      ];
    }
    return this.allAdapters;
  }

  /**
   * Clear adapter cache (useful for testing)
   */
  static clearCache(): void {
    this.adapters.clear();
    this.allAdapters = null;
  }
}
