// backend/src/services/ai/adapters/loaders/adapter-loader.ts
// Standards: docs/STANDARDS.md

/**
 * @file adapter-loader.ts
 * @description Carregamento lazy de adapters
 * @module services/ai/adapters/loaders
 */

import { BaseModelAdapter } from '../base.adapter';
import { InferenceType } from '../../types';
import { logger } from '../../../../utils/logger';

/**
 * Factory function para criar adapter
 */
export type AdapterFactory = () => BaseModelAdapter;

/**
 * Configuração de carregamento
 */
export interface LoaderConfig {
  /**
   * Se deve fazer cache de adapters
   */
  enableCache: boolean;

  /**
   * Tempo máximo de cache (ms)
   */
  cacheTimeout?: number;

  /**
   * Se deve validar adapters após carregamento
   */
  validateAfterLoad: boolean;
}

/**
 * Entrada de cache
 */
interface CacheEntry {
  adapter: BaseModelAdapter;
  timestamp: number;
}

/**
 * Loader de adapters com suporte a lazy loading e cache
 * 
 * @example
 * ```typescript
 * const loader = new AdapterLoader();
 * 
 * // Registrar factory
 * loader.registerFactory('anthropic', 'ON_DEMAND', () => new AnthropicAdapter());
 * 
 * // Carregar adapter (lazy)
 * const adapter = loader.load('anthropic', 'ON_DEMAND');
 * ```
 */
export class AdapterLoader {
  /**
   * Mapa de factories registradas
   */
  private factories: Map<string, AdapterFactory> = new Map();

  /**
   * Cache de adapters carregados
   */
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Configuração
   */
  private config: LoaderConfig;

  constructor(config?: Partial<LoaderConfig>) {
    this.config = {
      enableCache: true,
      cacheTimeout: 60000, // 1 minuto
      validateAfterLoad: true,
      ...config
    };
  }

  /**
   * Registra factory para criar adapter
   * 
   * @param vendor - Nome do vendor
   * @param inferenceType - Tipo de inference
   * @param factory - Factory function
   */
  registerFactory(vendor: string, inferenceType: InferenceType, factory: AdapterFactory): void {
    const key = this.getCacheKey(vendor, inferenceType);
    this.factories.set(key, factory);
    
    logger.debug('[AdapterLoader] Factory registered', { vendor, inferenceType });
  }

  /**
   * Remove factory registrada
   * 
   * @param vendor - Nome do vendor
   * @param inferenceType - Tipo de inference
   * @returns true se removido
   */
  unregisterFactory(vendor: string, inferenceType: InferenceType): boolean {
    const key = this.getCacheKey(vendor, inferenceType);
    const existed = this.factories.delete(key);
    
    if (existed) {
      // Limpar cache também
      this.cache.delete(key);
      logger.debug('[AdapterLoader] Factory unregistered', { vendor, inferenceType });
    }

    return existed;
  }

  /**
   * Carrega adapter (lazy loading com cache)
   * 
   * @param vendor - Nome do vendor
   * @param inferenceType - Tipo de inference
   * @returns Adapter instance
   * @throws Error se factory não registrada
   */
  load(vendor: string, inferenceType: InferenceType): BaseModelAdapter {
    const key = this.getCacheKey(vendor, inferenceType);

    // Verificar cache
    if (this.config.enableCache) {
      const cached = this.getFromCache(key);
      if (cached) {
        logger.debug('[AdapterLoader] Adapter loaded from cache', { vendor, inferenceType });
        return cached;
      }
    }

    // Buscar factory
    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(`No factory registered for ${vendor}/${inferenceType}`);
    }

    // Criar adapter
    logger.debug('[AdapterLoader] Creating new adapter', { vendor, inferenceType });
    const adapter = factory();

    // Validar se configurado
    if (this.config.validateAfterLoad) {
      this.validateAdapter(adapter, vendor, inferenceType);
    }

    // Adicionar ao cache
    if (this.config.enableCache) {
      this.addToCache(key, adapter);
    }

    return adapter;
  }

  /**
   * Pré-carrega adapter (warm-up)
   * 
   * @param vendor - Nome do vendor
   * @param inferenceType - Tipo de inference
   */
  preload(vendor: string, inferenceType: InferenceType): void {
    try {
      this.load(vendor, inferenceType);
      logger.debug('[AdapterLoader] Adapter preloaded', { vendor, inferenceType });
    } catch (error) {
      logger.warn('[AdapterLoader] Failed to preload adapter', { vendor, inferenceType, error });
    }
  }

  /**
   * Pré-carrega múltiplos adapters
   * 
   * @param configs - Array de [vendor, inferenceType]
   */
  preloadBatch(configs: Array<[string, InferenceType]>): void {
    for (const [vendor, inferenceType] of configs) {
      this.preload(vendor, inferenceType);
    }
  }

  /**
   * Verifica se factory está registrada
   * 
   * @param vendor - Nome do vendor
   * @param inferenceType - Tipo de inference
   * @returns true se registrada
   */
  hasFactory(vendor: string, inferenceType: InferenceType): boolean {
    const key = this.getCacheKey(vendor, inferenceType);
    return this.factories.has(key);
  }

  /**
   * Limpa cache
   * 
   * @param vendor - Nome do vendor (opcional)
   * @param inferenceType - Tipo de inference (opcional)
   */
  clearCache(vendor?: string, inferenceType?: InferenceType): void {
    if (vendor && inferenceType) {
      const key = this.getCacheKey(vendor, inferenceType);
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
    
    logger.debug('[AdapterLoader] Cache cleared', { vendor, inferenceType });
  }

  /**
   * Obtém estatísticas
   * 
   * @returns Estatísticas do loader
   */
  getStats(): {
    totalFactories: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
    return {
      totalFactories: this.factories.size,
      cacheSize: this.cache.size,
      cacheHitRate: 0 // TODO: implementar tracking de hits/misses
    };
  }

  /**
   * Gera chave de cache
   */
  private getCacheKey(vendor: string, inferenceType: InferenceType): string {
    return `${vendor.toLowerCase()}:${inferenceType}`;
  }

  /**
   * Obtém adapter do cache
   */
  private getFromCache(key: string): BaseModelAdapter | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar timeout
    if (this.config.cacheTimeout) {
      const age = Date.now() - entry.timestamp;
      if (age > this.config.cacheTimeout) {
        this.cache.delete(key);
        return null;
      }
    }

    return entry.adapter;
  }

  /**
   * Adiciona adapter ao cache
   */
  private addToCache(key: string, adapter: BaseModelAdapter): void {
    this.cache.set(key, {
      adapter,
      timestamp: Date.now()
    });
  }

  /**
   * Valida adapter após carregamento
   */
  private validateAdapter(adapter: BaseModelAdapter, vendor: string, inferenceType: InferenceType): void {
    if (!adapter.vendor) {
      throw new Error(`Adapter for ${vendor}/${inferenceType} missing vendor property`);
    }

    if (!adapter.inferenceType) {
      throw new Error(`Adapter for ${vendor}/${inferenceType} missing inferenceType property`);
    }

    if (adapter.vendor.toLowerCase() !== vendor.toLowerCase()) {
      logger.warn('[AdapterLoader] Vendor mismatch', {
        expected: vendor,
        actual: adapter.vendor
      });
    }

    if (adapter.inferenceType !== inferenceType) {
      logger.warn('[AdapterLoader] InferenceType mismatch', {
        expected: inferenceType,
        actual: adapter.inferenceType
      });
    }
  }
}
