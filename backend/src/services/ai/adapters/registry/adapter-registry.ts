// backend/src/services/ai/adapters/registry/adapter-registry.ts
// Standards: docs/STANDARDS.md

/**
 * @file adapter-registry.ts
 * @description Registro dinâmico de strategies de adapters
 * @module services/ai/adapters/registry
 */

import { VendorStrategy, VendorStrategyRegistration } from '../strategies/vendor-strategy.interface';
import { logger } from '../../../../utils/logger';

/**
 * Registry Pattern: Registro dinâmico de strategies
 * 
 * Permite registro e busca de strategies em runtime.
 * Suporta prioridades para resolução de conflitos.
 * 
 * @example
 * ```typescript
 * const registry = new AdapterRegistry();
 * 
 * // Registrar strategy
 * registry.register({
 *   vendor: 'anthropic',
 *   strategy: new AnthropicStrategy(),
 *   priority: 10
 * });
 * 
 * // Buscar strategy
 * const strategy = registry.getStrategy('anthropic');
 * 
 * // Buscar por modelId
 * const strategy = registry.findStrategyForModel('anthropic.claude-3');
 * ```
 */
export class AdapterRegistry {
  /**
   * Mapa de strategies por vendor
   */
  private strategies: Map<string, VendorStrategy> = new Map();

  /**
   * Mapa de prioridades por vendor
   */
  private priorities: Map<string, number> = new Map();

  /**
   * Ordem de detecção (vendors ordenados por prioridade)
   */
  private detectionOrder: string[] = [];

  /**
   * Registra uma strategy
   * 
   * @param registration - Dados de registro
   * @throws Error se vendor já registrado com prioridade maior
   */
  register(registration: VendorStrategyRegistration): void {
    const { vendor, strategy, priority } = registration;

    // Validar vendor
    if (!vendor || vendor.trim() === '') {
      throw new Error('Vendor name cannot be empty');
    }

    // Validar strategy
    if (!strategy) {
      throw new Error('Strategy cannot be null');
    }

    // Verificar se vendor já está registrado
    const existingPriority = this.priorities.get(vendor);
    if (existingPriority !== undefined && existingPriority > priority) {
      logger.warn('[AdapterRegistry] Strategy with lower priority ignored', {
        vendor,
        existingPriority,
        newPriority: priority
      });
      return;
    }

    // Registrar strategy
    this.strategies.set(vendor, strategy);
    this.priorities.set(vendor, priority);

    // Atualizar ordem de detecção
    this.updateDetectionOrder();

    logger.info('[AdapterRegistry] Strategy registered', {
      vendor,
      priority,
      supportedInferenceTypes: strategy.supportedInferenceTypes
    });
  }

  /**
   * Remove registro de uma strategy
   * 
   * @param vendor - Nome do vendor
   * @returns true se removido, false se não encontrado
   */
  unregister(vendor: string): boolean {
    const existed = this.strategies.delete(vendor);
    this.priorities.delete(vendor);
    
    if (existed) {
      this.updateDetectionOrder();
      logger.info('[AdapterRegistry] Strategy unregistered', { vendor });
    }

    return existed;
  }

  /**
   * Obtém strategy por vendor
   * 
   * @param vendor - Nome do vendor
   * @returns Strategy ou undefined se não encontrado
   */
  getStrategy(vendor: string): VendorStrategy | undefined {
    return this.strategies.get(vendor.toLowerCase());
  }

  /**
   * Busca strategy que pode lidar com o modelId
   * 
   * Tenta todas as strategies em ordem de prioridade.
   * Retorna a primeira que pode lidar com o modelo.
   * 
   * @param modelId - ID do modelo
   * @returns Strategy ou undefined se nenhuma encontrada
   */
  findStrategyForModel(modelId: string): VendorStrategy | undefined {
    logger.debug('[AdapterRegistry] Finding strategy for model', { modelId });

    // Tentar em ordem de prioridade
    for (const vendor of this.detectionOrder) {
      const strategy = this.strategies.get(vendor);
      if (strategy && strategy.canHandle(modelId)) {
        logger.debug('[AdapterRegistry] Strategy found', { vendor, modelId });
        return strategy;
      }
    }

    logger.warn('[AdapterRegistry] No strategy found for model', { modelId });
    return undefined;
  }

  /**
   * Obtém todos os vendors registrados
   * 
   * @returns Array de nomes de vendors
   */
  getAllVendors(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Verifica se vendor está registrado
   * 
   * @param vendor - Nome do vendor
   * @returns true se registrado
   */
  isVendorSupported(vendor: string): boolean {
    return this.strategies.has(vendor.toLowerCase());
  }

  /**
   * Obtém prioridade de um vendor
   * 
   * @param vendor - Nome do vendor
   * @returns Prioridade ou undefined se não registrado
   */
  getPriority(vendor: string): number | undefined {
    return this.priorities.get(vendor.toLowerCase());
  }

  /**
   * Obtém ordem de detecção
   * 
   * @returns Array de vendors ordenados por prioridade
   */
  getDetectionOrder(): string[] {
    return [...this.detectionOrder];
  }

  /**
   * Obtém todas as strategies registradas
   * 
   * @returns Array de [vendor, strategy]
   */
  getAllStrategies(): Array<[string, VendorStrategy]> {
    return Array.from(this.strategies.entries());
  }

  /**
   * Obtém contagem de strategies registradas
   * 
   * @returns Número de strategies
   */
  getCount(): number {
    return this.strategies.size;
  }

  /**
   * Limpa todos os registros (útil para testes)
   */
  clear(): void {
    this.strategies.clear();
    this.priorities.clear();
    this.detectionOrder = [];
    logger.info('[AdapterRegistry] Registry cleared');
  }

  /**
   * Atualiza ordem de detecção baseada em prioridades
   */
  private updateDetectionOrder(): void {
    this.detectionOrder = Array.from(this.priorities.entries())
      .sort((a, b) => b[1] - a[1]) // Ordenar por prioridade (maior primeiro)
      .map(([vendor]) => vendor);
  }

  /**
   * Valida se todas as strategies registradas são válidas
   * 
   * @returns Array de erros de validação (vazio se tudo OK)
   */
  validate(): string[] {
    const errors: string[] = [];

    for (const [vendor, strategy] of this.strategies.entries()) {
      // Validar vendor name
      if (strategy.vendor !== vendor) {
        errors.push(`Strategy vendor mismatch: registered as '${vendor}' but strategy.vendor is '${strategy.vendor}'`);
      }

      // Validar supportedInferenceTypes
      if (!strategy.supportedInferenceTypes || strategy.supportedInferenceTypes.length === 0) {
        errors.push(`Strategy '${vendor}' has no supported inference types`);
      }

      // Validar métodos obrigatórios
      if (typeof strategy.canHandle !== 'function') {
        errors.push(`Strategy '${vendor}' missing canHandle method`);
      }

      if (typeof strategy.detectInferenceType !== 'function') {
        errors.push(`Strategy '${vendor}' missing detectInferenceType method`);
      }

      if (typeof strategy.createAdapter !== 'function') {
        errors.push(`Strategy '${vendor}' missing createAdapter method`);
      }

      if (typeof strategy.validateModelId !== 'function') {
        errors.push(`Strategy '${vendor}' missing validateModelId method`);
      }

      if (typeof strategy.normalizeModelId !== 'function') {
        errors.push(`Strategy '${vendor}' missing normalizeModelId method`);
      }
    }

    return errors;
  }

  /**
   * Obtém estatísticas do registry
   * 
   * @returns Objeto com estatísticas
   */
  getStats(): {
    totalStrategies: number;
    vendors: string[];
    averagePriority: number;
    detectionOrder: string[];
  } {
    const priorities = Array.from(this.priorities.values());
    const averagePriority = priorities.length > 0
      ? priorities.reduce((sum, p) => sum + p, 0) / priorities.length
      : 0;

    return {
      totalStrategies: this.strategies.size,
      vendors: this.getAllVendors(),
      averagePriority,
      detectionOrder: this.detectionOrder
    };
  }
}
