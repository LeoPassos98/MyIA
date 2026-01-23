// backend/src/services/ai/registry/model-registry.ts
// Standards: docs/STANDARDS.md

import { ModelCapabilities as DetailedCapabilities } from '../../../types/capabilities';
import { logger } from '../../../utils/logger';

/**
 * Model capabilities (features supported by the model)
 * @deprecated Use DetailedCapabilities from types/capabilities.ts instead
 */
export interface ModelCapabilities {
  streaming: boolean;
  vision: boolean;
  functionCalling: boolean;
  maxContextWindow: number;
  maxOutputTokens: number;
}

/**
 * Platform-specific rules for a model
 */
export interface PlatformRule {
  platform: 'bedrock' | 'azure' | 'vertex' | 'direct';
  rule: string; // e.g., 'requires_inference_profile', 'region_specific'
  config?: any; // Additional configuration
}

/**
 * Recommended parameters for auto mode
 */
export interface RecommendedParams {
  temperature: number;
  topP?: number;
  topK?: number;
  maxTokens: number;
}

/**
 * Complete metadata for a model
 */
export interface ModelMetadata {
  modelId: string;
  vendor: string;
  displayName: string;
  description?: string;
  capabilities: ModelCapabilities;
  supportedPlatforms: string[];
  platformRules?: PlatformRule[];
  adapterClass: string; // e.g., 'CohereAdapter'
  deprecated?: boolean;
  replacedBy?: string;
  recommendedParams?: RecommendedParams; // ✅ NOVO: Valores recomendados para modo auto
}

/**
 * Centralized registry for all supported models
 * 
 * This registry provides:
 * - Model metadata (capabilities, platforms, rules)
 * - Automatic filtering of supported models
 * - Platform-specific rule lookup
 * - Adapter mapping
 */
export class ModelRegistry {
  private static models: Map<string, ModelMetadata> = new Map();

  /**
   * Register a model in the registry
   * 
   * @param metadata - Complete model metadata
   */
  static register(metadata: ModelMetadata): void {
    this.models.set(metadata.modelId, metadata);
  }

  /**
   * Register multiple models at once
   * 
   * @param metadataList - Array of model metadata
   */
  static registerMany(metadataList: ModelMetadata[]): void {
    metadataList.forEach(metadata => this.register(metadata));
  }

  /**
   * Get metadata for a specific model
   * 
   * @param modelId - Model ID
   * @returns Model metadata or undefined if not found
   */
  static getModel(modelId: string): ModelMetadata | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all models for a specific vendor
   * 
   * @param vendor - Vendor name (e.g., 'anthropic', 'cohere')
   * @returns Array of model metadata
   */
  static getModelsByVendor(vendor: string): ModelMetadata[] {
    return Array.from(this.models.values())
      .filter(m => m.vendor.toLowerCase() === vendor.toLowerCase());
  }

  /**
   * Get all models supported on a specific platform
   * 
   * @param platform - Platform name (e.g., 'bedrock', 'azure')
   * @returns Array of model metadata
   */
  static getModelsByPlatform(platform: string): ModelMetadata[] {
    return Array.from(this.models.values())
      .filter(m => m.supportedPlatforms.includes(platform));
  }

  /**
   * Check if a model is supported
   * 
   * @param modelId - Model ID to check
   * @returns true if supported
   */
  static isSupported(modelId: string): boolean {
    return this.models.has(modelId);
  }

  /**
   * Get platform-specific rules for a model
   * 
   * @param modelId - Model ID
   * @param platform - Platform name
   * @returns Platform rule or undefined if not found
   */
  static getPlatformRules(
    modelId: string,
    platform: string
  ): PlatformRule | undefined {
    const model = this.getModel(modelId);
    return model?.platformRules?.find(r => r.platform === platform);
  }

  /**
   * Get all supported models (non-deprecated)
   * 
   * @returns Array of model metadata
   */
  static getAllSupported(): ModelMetadata[] {
    return Array.from(this.models.values())
      .filter(m => !m.deprecated);
  }

  /**
   * Get all models (including deprecated)
   * 
   * @returns Array of model metadata
   */
  static getAll(): ModelMetadata[] {
    return Array.from(this.models.values());
  }

  /**
   * Clear the registry (useful for testing)
   */
  static clear(): void {
    this.models.clear();
  }

  /**
   * Get count of registered models
   * 
   * @returns Number of models
   */
  static count(): number {
    return this.models.size;
  }

  /**
   * Check if a model requires special handling on a platform
   * 
   * @param modelId - Model ID
   * @param platform - Platform name
   * @param rule - Rule to check for
   * @returns true if model has the specified rule
   */
  static hasRule(modelId: string, platform: string, rule: string): boolean {
    const platformRule = this.getPlatformRules(modelId, platform);
    return platformRule?.rule === rule;
  }

  /**
   * Normalize model ID from frontend format to registry format
   *
   * Frontend sends: "anthropic:claude-3-5-sonnet-20241022"
   * Registry expects: "anthropic.claude-3-5-sonnet-20241022-v2:0"
   *
   * This method tries to find the best match in the registry.
   *
   * @param modelId - Model ID in any format
   * @returns Normalized model ID or undefined if not found
   */
  static normalizeModelId(modelId: string): string | undefined {
    // Se já está no formato correto e existe, retorna
    if (this.models.has(modelId)) {
      return modelId;
    }

    // Converte formato frontend (provider:model) para backend (provider.model)
    const frontendFormat = modelId.replace(':', '.');

    // Tenta encontrar correspondência exata
    if (this.models.has(frontendFormat)) {
      return frontendFormat;
    }

    // Tenta encontrar por correspondência parcial (busca por prefixo)
    // Ex: "anthropic.claude-3-5-sonnet-20241022" encontra "anthropic.claude-3-5-sonnet-20241022-v2:0"
    const allModels = Array.from(this.models.keys());
    
    // Busca exata por prefixo
    const exactMatch = allModels.find(m => m === frontendFormat);
    if (exactMatch) {
      return exactMatch;
    }

    // Busca por prefixo (modelo sem versão)
    const prefixMatch = allModels.find(m => m.startsWith(frontendFormat));
    if (prefixMatch) {
      logger.debug(`Model ID normalized: ${modelId} -> ${prefixMatch}`);
      return prefixMatch;
    }

    // Busca por nome similar (remove versões e sufixos)
    const baseModelId = frontendFormat.split(':')[0]; // Remove sufixos como :8k
    const similarMatch = allModels.find(m => {
      const baseRegistryId = m.split(':')[0];
      return baseRegistryId.startsWith(baseModelId) || baseModelId.startsWith(baseRegistryId);
    });

    if (similarMatch) {
      logger.debug(`Model ID normalized (similar): ${modelId} -> ${similarMatch}`);
      return similarMatch;
    }

    logger.warn(`Could not normalize model ID: ${modelId}`);
    return undefined;
  }
}

/**
 * Build detailed capabilities object from model metadata
 *
 * Aplica regras específicas por vendor para determinar quais parâmetros
 * são suportados e seus valores padrão.
 *
 * @param metadata - Model metadata from registry
 * @returns Detailed capabilities object
 */
export function buildCapabilities(metadata: ModelMetadata): DetailedCapabilities {
  const vendor = metadata.vendor.toLowerCase();
  
  logger.debug(`[buildCapabilities] Building for model: ${metadata.modelId} (vendor: ${vendor})`);
  logger.debug(`[buildCapabilities] Metadata:`, {
    modelId: metadata.modelId,
    vendor: metadata.vendor,
    displayName: metadata.displayName,
    maxContextWindow: metadata.capabilities.maxContextWindow,
    maxOutputTokens: metadata.capabilities.maxOutputTokens,
  });

  // Regras base comuns a todos os modelos
  const baseCapabilities: DetailedCapabilities = {
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
      max: metadata.capabilities.maxOutputTokens,
      default: Math.min(2048, metadata.capabilities.maxOutputTokens),
    },

    // Stop Sequences: suportado por todos
    stopSequences: {
      enabled: true,
      max: vendor === 'anthropic' ? 4 : 10,
    },

    // Streaming: baseado no metadata
    streaming: {
      enabled: metadata.capabilities.streaming,
    },

    // Vision: baseado no metadata
    vision: {
      enabled: metadata.capabilities.vision,
    },

    // Function Calling: baseado no metadata
    functionCalling: {
      enabled: metadata.capabilities.functionCalling,
    },

    // System Prompt: suportado por todos
    systemPrompt: {
      enabled: true,
    },

    // Context Window: do metadata
    maxContextWindow: metadata.capabilities.maxContextWindow,

    // Max Output Tokens: do metadata
    maxOutputTokens: metadata.capabilities.maxOutputTokens,

    // Inference Profile: verifica se tem regra de inference profile
    requiresInferenceProfile: metadata.platformRules?.some(
      rule => rule.rule === 'requires_inference_profile'
    ) ?? false,
  };

  logger.debug(`[buildCapabilities] Result for ${metadata.modelId}:`, {
    temperature: baseCapabilities.temperature,
    topK: baseCapabilities.topK,
    topP: baseCapabilities.topP,
    maxTokens: baseCapabilities.maxTokens,
    requiresInferenceProfile: baseCapabilities.requiresInferenceProfile,
  });

  return baseCapabilities;
}
