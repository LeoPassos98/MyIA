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

// Novo sistema (Strategy Pattern + Registry Pattern)
import { AdapterRegistry } from './registry/adapter-registry';
import { VendorDetector } from './registry/vendor-detector';
import { registerAllStrategies } from './strategies';

/**
 * Feature flags para migração gradual
 */
function isUseNewAdapters(): boolean {
  return process.env.USE_NEW_ADAPTERS === 'true';
}

function isUseStrategyPattern(): boolean {
  return process.env.USE_STRATEGY_PATTERN === 'true';
}

/**
 * Mapa de adapters por vendor e inference type (LEGADO)
 */
const adapterMap: Record<string, Record<InferenceType, new () => BaseModelAdapter>> = {
  anthropic: {
    ON_DEMAND: AnthropicAdapter,
    INFERENCE_PROFILE: AnthropicProfileAdapter,
    PROVISIONED: AnthropicAdapter,
    CROSS_REGION: AnthropicAdapter
  },
  amazon: {
    ON_DEMAND: AmazonAdapter,
    INFERENCE_PROFILE: AmazonProfileAdapter,
    PROVISIONED: AmazonAdapter,
    CROSS_REGION: AmazonAdapter
  },
  cohere: {
    ON_DEMAND: CohereAdapter,
    INFERENCE_PROFILE: CohereAdapter,
    PROVISIONED: CohereAdapter,
    CROSS_REGION: CohereAdapter
  }
};

/**
 * Factory para criar adapters
 */
export class AdapterFactory {
  // Sistema legado (cache de adapters)
  private static adapters: Map<string, BaseModelAdapter> = new Map();
  private static allAdapters: BaseModelAdapter[] | null = null;

  // Novo sistema (Strategy Pattern + Registry Pattern)
  private static registry: AdapterRegistry = new AdapterRegistry();
  private static detector: VendorDetector = new VendorDetector();
  private static strategiesInitialized = false;

  /**
   * Inicializa strategies (lazy initialization)
   */
  private static initializeStrategies(): void {
    if (this.strategiesInitialized) {
      return;
    }

    logger.info('[AdapterFactory] Initializing Strategy Pattern system');
    registerAllStrategies(this.registry);
    this.strategiesInitialized = true;

    // Validar registry
    const errors = this.registry.validate();
    if (errors.length > 0) {
      logger.error('[AdapterFactory] Registry validation failed', { errors });
      throw new Error(`Registry validation failed: ${errors.join(', ')}`);
    }

    logger.info('[AdapterFactory] Strategy Pattern system initialized', {
      vendors: this.registry.getAllVendors(),
      stats: this.registry.getStats()
    });
  }

  /**
   * Cria adapter apropriado baseado em vendor e inference type
   */
  static createAdapter(vendor: string, inferenceType: InferenceType = 'ON_DEMAND'): BaseModelAdapter {
    const useStrategyPattern = isUseStrategyPattern();
    const useNewAdapters = isUseNewAdapters();

    logger.info('[AdapterFactory] Creating adapter', { 
      vendor, 
      inferenceType, 
      useStrategyPattern,
      useNewAdapters,
      env_USE_STRATEGY_PATTERN: process.env.USE_STRATEGY_PATTERN,
      env_USE_NEW_ADAPTERS: process.env.USE_NEW_ADAPTERS 
    });

    // Novo sistema: Strategy Pattern
    if (useStrategyPattern) {
      return this.createAdapterV2(vendor, inferenceType);
    }

    // Sistema intermediário: USE_NEW_ADAPTERS
    if (!useNewAdapters) {
      logger.warn('⚠️ [AdapterFactory] USE_NEW_ADAPTERS is not enabled, using legacy adapters. ' +
        'This may cause issues with Claude 4.x models that require Inference Profiles. ' +
        'Set USE_NEW_ADAPTERS=true in .env to enable modern adapters.');
      return this.createLegacyAdapter(vendor);
    }

    // Sistema atual: adapterMap
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
   * Cria adapter usando Strategy Pattern (V2)
   */
  private static createAdapterV2(vendor: string, inferenceType: InferenceType): BaseModelAdapter {
    // Inicializar strategies se necessário
    this.initializeStrategies();

    logger.debug('[AdapterFactory] Using Strategy Pattern', { vendor, inferenceType });

    // Buscar strategy no registry
    const strategy = this.registry.getStrategy(vendor.toLowerCase());
    if (!strategy) {
      throw new Error(`Vendor not supported: ${vendor}`);
    }

    // Validar inference type
    if (!strategy.supportedInferenceTypes.includes(inferenceType)) {
      logger.warn(`[AdapterFactory] Inference type ${inferenceType} not supported by ${vendor}, using ON_DEMAND`);
      inferenceType = 'ON_DEMAND';
    }

    // Criar adapter
    return strategy.createAdapter(inferenceType);
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
   */
  static detectInferenceType(modelId: string): InferenceType {
    const useStrategyPattern = isUseStrategyPattern();

    // Novo sistema: usar strategy
    if (useStrategyPattern) {
      this.initializeStrategies();
      
      const strategy = this.registry.findStrategyForModel(modelId);
      if (strategy) {
        return strategy.detectInferenceType(modelId);
      }
    }

    // Sistema legado: detecção por formato
    // 1. Verificar formato do modelId primeiro (mais rápido)
    if (/^(us|eu|apac)\.[a-z]+\./i.test(modelId)) {
      return 'INFERENCE_PROFILE';
    }

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
      logger.debug(`Model ${modelId} not found in registry, using format-based detection`);
    }

    // 3. Default: ON_DEMAND
    return 'ON_DEMAND';
  }

  /**
   * Get adapter for a specific vendor (Legacy method - mantido para compatibilidade)
   * 
   * @deprecated Use createAdapter(vendor, inferenceType) instead
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
   */
  static getAdapterForModel(modelId: string): BaseModelAdapter {
    const useStrategyPattern = isUseStrategyPattern();

    // Novo sistema: usar strategy
    if (useStrategyPattern) {
      this.initializeStrategies();
      
      const strategy = this.registry.findStrategyForModel(modelId);
      if (strategy) {
        const inferenceType = strategy.detectInferenceType(modelId);
        return strategy.createAdapter(inferenceType);
      }
      
      throw new Error(`No strategy found for model: ${modelId}`);
    }

    // Sistema legado
    const inferenceType = this.detectInferenceType(modelId);
    const vendor = this.detectVendor(modelId);

    if (vendor) {
      try {
        return this.createAdapter(vendor, inferenceType);
      } catch (error) {
        logger.warn(`Failed to create adapter for ${vendor}/${inferenceType}, falling back to search`, { error });
      }
    }

    // Fallback: buscar em todos os adapters
    if (!this.allAdapters) {
      this.allAdapters = [
        this.getAdapter('anthropic'),
        this.getAdapter('cohere'),
        this.getAdapter('amazon'),
      ];
    }

    for (const adapter of this.allAdapters) {
      if (adapter.supportsModel(modelId)) {
        return adapter;
      }
    }

    throw new Error(`No adapter found for model: ${modelId}`);
  }

  /**
   * Detect vendor from model ID
   */
  static detectVendor(modelId: string): string | null {
    const useStrategyPattern = isUseStrategyPattern();

    // Novo sistema: usar detector
    if (useStrategyPattern) {
      this.initializeStrategies();
      return this.detector.detect(modelId);
    }

    // Sistema legado
    const inferenceProfileMatch = modelId.match(/^(us|eu|apac)\.([a-z]+)\./i);
    if (inferenceProfileMatch) {
      return inferenceProfileMatch[2].toLowerCase();
    }

    const prefix = modelId.split('.')[0].toLowerCase();
    const knownVendors = ['anthropic', 'cohere', 'amazon', 'ai21', 'meta', 'mistral'];
    
    if (knownVendors.includes(prefix)) {
      return prefix;
    }

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

  /**
   * Get registry (para testes e extensibilidade)
   */
  static getRegistry(): AdapterRegistry {
    this.initializeStrategies();
    return this.registry;
  }

  /**
   * Get detector (para testes e extensibilidade)
   */
  static getDetector(): VendorDetector {
    return this.detector;
  }

  /**
   * Reset factory (útil para testes)
   */
  static reset(): void {
    this.clearCache();
    this.registry.clear();
    this.detector.reset();
    this.strategiesInitialized = false;
  }
}
