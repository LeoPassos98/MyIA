// backend/src/services/ai/adapters/registry/vendor-detector.ts
// Standards: docs/STANDARDS.md

/**
 * @file vendor-detector.ts
 * @description Detecção centralizada de vendor baseada em padrões
 * @module services/ai/adapters/registry
 */

import { logger } from '../../../../utils/logger';

/**
 * Regra de detecção de vendor
 */
export interface DetectionRule {
  /**
   * Padrão regex para matching
   */
  pattern: RegExp;

  /**
   * Nome do vendor detectado
   */
  vendor: string;

  /**
   * Prioridade (maior = maior prioridade)
   */
  priority: number;

  /**
   * Descrição da regra (para debug)
   */
  description?: string;
}

/**
 * Detector centralizado de vendor
 * 
 * Centraliza toda lógica de detecção de vendor baseada em padrões.
 * Suporta múltiplas estratégias de detecção com prioridades.
 * 
 * @example
 * ```typescript
 * const detector = new VendorDetector();
 * 
 * // Adicionar regra customizada
 * detector.addRule({
 *   pattern: /^custom\./,
 *   vendor: 'custom-vendor',
 *   priority: 15
 * });
 * 
 * // Detectar vendor
 * const vendor = detector.detect('anthropic.claude-3'); // 'anthropic'
 * ```
 */
export class VendorDetector {
  private rules: DetectionRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Inicializa regras padrão de detecção
   */
  private initializeDefaultRules(): void {
    // Regras de Inference Profile (maior prioridade)
    this.addRule({
      pattern: /^(us|eu|apac)\.anthropic\./i,
      vendor: 'anthropic',
      priority: 20,
      description: 'Anthropic Inference Profile'
    });

    this.addRule({
      pattern: /^(us|eu|apac)\.amazon\./i,
      vendor: 'amazon',
      priority: 20,
      description: 'Amazon Inference Profile'
    });

    this.addRule({
      pattern: /^(us|eu|apac)\.cohere\./i,
      vendor: 'cohere',
      priority: 20,
      description: 'Cohere Inference Profile'
    });

    // Regras de formato padrão (prioridade média)
    this.addRule({
      pattern: /^anthropic\./i,
      vendor: 'anthropic',
      priority: 10,
      description: 'Anthropic standard format'
    });

    this.addRule({
      pattern: /^amazon\./i,
      vendor: 'amazon',
      priority: 10,
      description: 'Amazon standard format'
    });

    this.addRule({
      pattern: /^cohere\./i,
      vendor: 'cohere',
      priority: 10,
      description: 'Cohere standard format'
    });

    this.addRule({
      pattern: /^ai21\./i,
      vendor: 'ai21',
      priority: 10,
      description: 'AI21 standard format'
    });

    this.addRule({
      pattern: /^meta\./i,
      vendor: 'meta',
      priority: 10,
      description: 'Meta standard format'
    });

    this.addRule({
      pattern: /^mistral\./i,
      vendor: 'mistral',
      priority: 10,
      description: 'Mistral standard format'
    });

    // Regras de Direct API format (menor prioridade)
    this.addRule({
      pattern: /^claude-/i,
      vendor: 'anthropic',
      priority: 5,
      description: 'Claude direct API format'
    });

    this.addRule({
      pattern: /^command-/i,
      vendor: 'cohere',
      priority: 5,
      description: 'Cohere Command direct API format'
    });

    // Regras de ARN (prioridade especial)
    this.addRule({
      pattern: /^arn:aws:bedrock/i,
      vendor: 'provisioned',
      priority: 25,
      description: 'AWS Bedrock ARN (provisioned throughput)'
    });
  }

  /**
   * Adiciona regra de detecção
   * 
   * @param rule - Regra a ser adicionada
   */
  addRule(rule: DetectionRule): void {
    this.rules.push(rule);
    // Ordenar por prioridade (maior primeiro)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove regra de detecção
   * 
   * @param vendor - Vendor da regra a ser removida
   * @param priority - Prioridade da regra (opcional)
   */
  removeRule(vendor: string, priority?: number): void {
    this.rules = this.rules.filter(rule => {
      if (priority !== undefined) {
        return !(rule.vendor === vendor && rule.priority === priority);
      }
      return rule.vendor !== vendor;
    });
  }

  /**
   * Detecta vendor baseado em padrões
   * 
   * Tenta todas as regras em ordem de prioridade.
   * Retorna o primeiro match encontrado.
   * 
   * @param modelId - ID do modelo
   * @returns Nome do vendor ou null se não detectado
   */
  detect(modelId: string): string | null {
    logger.debug('[VendorDetector] Detecting vendor', { modelId });

    for (const rule of this.rules) {
      if (rule.pattern.test(modelId)) {
        logger.debug('[VendorDetector] Vendor detected', {
          modelId,
          vendor: rule.vendor,
          priority: rule.priority,
          description: rule.description
        });
        return rule.vendor;
      }
    }

    logger.warn('[VendorDetector] No vendor detected', { modelId });
    return null;
  }

  /**
   * Detecta vendor por prefixo (método auxiliar)
   * 
   * @param modelId - ID do modelo
   * @returns Nome do vendor ou null
   */
  detectByPrefix(modelId: string): string | null {
    const prefix = modelId.split('.')[0].toLowerCase();
    
    const knownVendors = ['anthropic', 'cohere', 'amazon', 'ai21', 'meta', 'mistral'];
    
    if (knownVendors.includes(prefix)) {
      return prefix;
    }

    return null;
  }

  /**
   * Detecta vendor de Inference Profile
   * 
   * Formato: {region}.{vendor}.{model}
   * 
   * @param modelId - ID do modelo
   * @returns Nome do vendor ou null
   */
  detectByInferenceProfile(modelId: string): string | null {
    const match = modelId.match(/^(us|eu|apac)\.([a-z]+)\./i);
    if (match) {
      return match[2].toLowerCase();
    }
    return null;
  }

  /**
   * Detecta vendor de Direct API format
   * 
   * @param modelId - ID do modelo
   * @returns Nome do vendor ou null
   */
  detectByDirectApi(modelId: string): string | null {
    if (modelId.startsWith('claude-')) {
      return 'anthropic';
    }
    
    if (modelId.startsWith('command-')) {
      return 'cohere';
    }

    return null;
  }

  /**
   * Obtém todas as regras registradas
   * 
   * @returns Array de regras ordenadas por prioridade
   */
  getRules(): DetectionRule[] {
    return [...this.rules];
  }

  /**
   * Obtém regras para um vendor específico
   * 
   * @param vendor - Nome do vendor
   * @returns Array de regras do vendor
   */
  getRulesForVendor(vendor: string): DetectionRule[] {
    return this.rules.filter(rule => rule.vendor === vendor);
  }

  /**
   * Limpa todas as regras (útil para testes)
   */
  clearRules(): void {
    this.rules = [];
  }

  /**
   * Reinicializa com regras padrão
   */
  reset(): void {
    this.clearRules();
    this.initializeDefaultRules();
  }
}
