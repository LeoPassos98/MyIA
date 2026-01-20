// backend/src/services/ai/adapters/adapter-factory.ts
// Standards: docs/STANDARDS.md

import { BaseModelAdapter } from './base.adapter';
import { AnthropicAdapter } from './anthropic.adapter';
import { CohereAdapter } from './cohere.adapter';
import { AmazonAdapter } from './amazon.adapter';

/**
 * Factory for creating and caching model adapters
 * 
 * Adapters are singletons (one instance per vendor) to avoid
 * unnecessary object creation.
 */
export class AdapterFactory {
  private static adapters: Map<string, BaseModelAdapter> = new Map();
  private static allAdapters: BaseModelAdapter[] | null = null;

  /**
   * Get adapter for a specific vendor
   * 
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

    // Create new adapter
    let adapter: BaseModelAdapter;

    switch (normalizedVendor) {
      case 'anthropic':
        adapter = new AnthropicAdapter();
        break;
      
      case 'cohere':
        adapter = new CohereAdapter();
        break;
      
      case 'amazon':
        adapter = new AmazonAdapter();
        break;
      
      default:
        throw new Error(`No adapter found for vendor: ${vendor}`);
    }

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
