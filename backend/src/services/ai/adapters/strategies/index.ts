// backend/src/services/ai/adapters/strategies/index.ts
// Standards: docs/STANDARDS.md

/**
 * @file index.ts
 * @description Auto-registro de strategies
 * @module services/ai/adapters/strategies
 */

import { AdapterRegistry } from '../registry/adapter-registry';
import { AnthropicStrategy } from './anthropic-strategy';
import { AmazonStrategy } from './amazon-strategy';
import { CohereStrategy } from './cohere-strategy';
import { logger } from '../../../../utils/logger';

/**
 * Registra todas as strategies no registry
 * 
 * @param registry - Registry onde registrar
 */
export function registerAllStrategies(registry: AdapterRegistry): void {
  logger.info('[Strategies] Registering all strategies');

  // Registrar Anthropic (prioridade 10)
  registry.register({
    vendor: 'anthropic',
    strategy: new AnthropicStrategy(),
    priority: 10
  });

  // Registrar Amazon (prioridade 10)
  registry.register({
    vendor: 'amazon',
    strategy: new AmazonStrategy(),
    priority: 10
  });

  // Registrar Cohere (prioridade 10)
  registry.register({
    vendor: 'cohere',
    strategy: new CohereStrategy(),
    priority: 10
  });

  logger.info('[Strategies] All strategies registered', {
    vendors: registry.getAllVendors(),
    count: registry.getCount()
  });
}

// Exports
export { AnthropicStrategy } from './anthropic-strategy';
export { AmazonStrategy } from './amazon-strategy';
export { CohereStrategy } from './cohere-strategy';
export { VendorStrategy, VendorStrategyRegistration } from './vendor-strategy.interface';
