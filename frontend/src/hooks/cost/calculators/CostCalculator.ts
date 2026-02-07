// frontend/src/hooks/cost/calculators/CostCalculator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Cost Calculator Module
 *
 * Centraliza lógica de cálculo de custos de tokens.
 * Elimina duplicação de código entre hooks.
 *
 * @module hooks/cost/calculators/CostCalculator
 */

import { ModelPricing, getModelPricing } from '../data/modelPricing';

/**
 * Entrada para cálculo de custo
 */
export interface CostCalculationInput {
  /** Número de tokens de entrada */
  inputTokens: number;
  /** Número de tokens de saída */
  outputTokens: number;
  /** Preços do modelo */
  pricing: ModelPricing;
}

/**
 * Resultado do cálculo de custo
 */
export interface CostCalculationResult {
  /** Custo de tokens de entrada (USD) */
  inputCost: number;
  /** Custo de tokens de saída (USD) */
  outputCost: number;
  /** Custo total (USD) */
  totalCost: number;
}

/**
 * Calculadora de custos de tokens
 * 
 * Classe estática que centraliza lógica de cálculo de custos.
 * Elimina duplicação de código entre diferentes hooks.
 */
export class CostCalculator {
  /**
   * Calcula custos baseado em tokens e preços
   * 
   * Fórmula: custo = (tokens / 1_000_000) * preço_por_milhão
   * 
   * @param input - Dados para cálculo
   * @returns Resultado com custos detalhados
   * 
   * @example
   * ```typescript
   * const result = CostCalculator.calculate({
   *   inputTokens: 1000,
   *   outputTokens: 2000,
   *   pricing: { input: 3.0, output: 15.0 }
   * });
   * 
   * console.log(result.totalCost); // 0.033 USD
   * ```
   */
  static calculate(input: CostCalculationInput): CostCalculationResult {
    const { inputTokens, outputTokens, pricing } = input;
    
    // Calcular custos (preços são por 1M tokens)
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;
    
    return {
      inputCost,
      outputCost,
      totalCost
    };
  }
  
  /**
   * Calcula custos para um modelo específico
   * 
   * Wrapper que busca preços automaticamente e calcula.
   * 
   * @param provider - Provider do modelo
   * @param modelId - ID do modelo
   * @param inputTokens - Tokens de entrada
   * @param outputTokens - Tokens de saída
   * @returns Resultado do cálculo ou null se modelo não tem preços
   * 
   * @example
   * ```typescript
   * const result = CostCalculator.calculateForModel(
   *   'anthropic',
   *   'claude-3-5-sonnet-20241022',
   *   1000,
   *   2000
   * );
   * 
   * if (result) {
   *   console.log(`Custo: $${result.totalCost}`);
   * }
   * ```
   */
  static calculateForModel(
    provider: string | null,
    modelId: string | null,
    inputTokens: number,
    outputTokens: number
  ): CostCalculationResult | null {
    const pricing = getModelPricing(provider, modelId);
    
    if (!pricing) {
      return null;
    }
    
    return this.calculate({
      inputTokens,
      outputTokens,
      pricing
    });
  }
  
  /**
   * Calcula custo estimado baseado em ratio input/output
   * 
   * Útil quando não se sabe exatamente quantos tokens de saída haverá.
   * 
   * @param inputTokens - Tokens de entrada
   * @param outputRatio - Ratio de output (ex: 2.0 = 2x input)
   * @param pricing - Preços do modelo
   * @returns Resultado do cálculo
   * 
   * @example
   * ```typescript
   * // Estimar que output será 2x o input
   * const result = CostCalculator.calculateWithRatio(
   *   1000,
   *   2.0,
   *   { input: 3.0, output: 15.0 }
   * );
   * ```
   */
  static calculateWithRatio(
    inputTokens: number,
    outputRatio: number,
    pricing: ModelPricing
  ): CostCalculationResult {
    const outputTokens = Math.round(inputTokens * outputRatio);
    
    return this.calculate({
      inputTokens,
      outputTokens,
      pricing
    });
  }
  
  /**
   * Calcula custo por token (útil para comparações)
   * 
   * @param pricing - Preços do modelo
   * @returns Custo médio por token
   * 
   * @example
   * ```typescript
   * const costPerToken = CostCalculator.calculateCostPerToken({
   *   input: 3.0,
   *   output: 15.0
   * });
   * 
   * console.log(`Média: $${costPerToken * 1000} por 1K tokens`);
   * ```
   */
  static calculateCostPerToken(pricing: ModelPricing): number {
    // Média entre input e output, convertido para custo por token
    return ((pricing.input + pricing.output) / 2) / 1_000_000;
  }
}
