// backend/src/services/ai/adapters/strategies/vendor-strategy.interface.ts
// Standards: docs/STANDARDS.md

/**
 * @file vendor-strategy.interface.ts
 * @description Interface para Strategy Pattern de vendors
 * @module services/ai/adapters/strategies
 */

import { BaseModelAdapter } from '../base.adapter';
import { InferenceType } from '../../types';

/**
 * Strategy Pattern: Interface para cada vendor implementar sua lógica
 * 
 * Cada vendor (Anthropic, Amazon, Cohere) implementa esta interface
 * para encapsular sua lógica de detecção, validação e criação de adapters.
 * 
 * @example
 * ```typescript
 * class AnthropicStrategy implements VendorStrategy {
 *   readonly vendor = 'anthropic';
 *   readonly supportedInferenceTypes = ['ON_DEMAND', 'INFERENCE_PROFILE'];
 *   
 *   canHandle(modelId: string): boolean {
 *     return modelId.startsWith('anthropic.') || modelId.startsWith('claude-');
 *   }
 *   
 *   createAdapter(inferenceType: InferenceType): BaseModelAdapter {
 *     return inferenceType === 'INFERENCE_PROFILE' 
 *       ? new AnthropicProfileAdapter()
 *       : new AnthropicAdapter();
 *   }
 * }
 * ```
 */
export interface VendorStrategy {
  /**
   * Nome do vendor (e.g., 'anthropic', 'amazon', 'cohere')
   */
  readonly vendor: string;

  /**
   * Tipos de inference suportados por este vendor
   */
  readonly supportedInferenceTypes: InferenceType[];

  /**
   * Verifica se esta strategy pode lidar com o modelId
   * 
   * @param modelId - ID do modelo (e.g., 'anthropic.claude-3-5-sonnet-20241022-v2:0')
   * @returns true se pode lidar com este modelo
   * 
   * @example
   * ```typescript
   * strategy.canHandle('anthropic.claude-3-5-sonnet'); // true
   * strategy.canHandle('cohere.command-r'); // false
   * ```
   */
  canHandle(modelId: string): boolean;

  /**
   * Detecta o tipo de inference baseado no formato do modelId
   * 
   * @param modelId - ID do modelo
   * @returns Tipo de inference detectado
   * 
   * @example
   * ```typescript
   * strategy.detectInferenceType('us.anthropic.claude-3'); // 'INFERENCE_PROFILE'
   * strategy.detectInferenceType('anthropic.claude-3'); // 'ON_DEMAND'
   * strategy.detectInferenceType('arn:aws:bedrock:...'); // 'PROVISIONED'
   * ```
   */
  detectInferenceType(modelId: string): InferenceType;

  /**
   * Cria adapter apropriado para o tipo de inference
   * 
   * @param inferenceType - Tipo de inference
   * @returns Instância do adapter
   * @throws Error se tipo não suportado
   * 
   * @example
   * ```typescript
   * const adapter = strategy.createAdapter('INFERENCE_PROFILE');
   * ```
   */
  createAdapter(inferenceType: InferenceType): BaseModelAdapter;

  /**
   * Valida se o modelId é válido para este vendor
   * 
   * @param modelId - ID do modelo
   * @returns true se válido
   * 
   * @example
   * ```typescript
   * strategy.validateModelId('anthropic.claude-3'); // true
   * strategy.validateModelId('invalid-format'); // false
   * ```
   */
  validateModelId(modelId: string): boolean;

  /**
   * Normaliza o modelId para formato padrão
   * 
   * Alguns vendors aceitam múltiplos formatos (e.g., 'claude-3' vs 'anthropic.claude-3')
   * Este método converte para formato canônico.
   * 
   * @param modelId - ID do modelo
   * @returns ModelId normalizado
   * 
   * @example
   * ```typescript
   * strategy.normalizeModelId('claude-3'); // 'anthropic.claude-3'
   * strategy.normalizeModelId('anthropic:claude-3'); // 'anthropic.claude-3'
   * ```
   */
  normalizeModelId(modelId: string): string;
}

/**
 * Tipo helper para registro de strategies
 */
export interface VendorStrategyRegistration {
  /**
   * Nome do vendor
   */
  vendor: string;

  /**
   * Instância da strategy
   */
  strategy: VendorStrategy;

  /**
   * Prioridade para resolução de conflitos (maior = maior prioridade)
   * 
   * Usado quando múltiplas strategies podem lidar com o mesmo modelId.
   * Strategy com maior prioridade é escolhida.
   * 
   * @default 10
   */
  priority: number;
}
