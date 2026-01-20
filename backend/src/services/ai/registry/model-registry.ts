// backend/src/services/ai/registry/model-registry.ts
// Standards: docs/STANDARDS.md

/**
 * Model capabilities (features supported by the model)
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
}
