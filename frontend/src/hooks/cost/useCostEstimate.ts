// frontend/src/hooks/cost/useCostEstimate.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * useCostEstimate Hook
 *
 * Hook para estimar o custo de uso de modelos de IA baseado em tokens.
 * Versão refatorada que usa módulos especializados.
 *
 * @module hooks/cost/useCostEstimate
 */

import { useMemo } from 'react';
import { useModelCapabilities } from '../useModelCapabilities';
import { getModelPricing } from './data/modelPricing';
import { CostCalculator } from './calculators/CostCalculator';
import { CostFormatter } from './formatters/CostFormatter';

/**
 * Resultado da estimativa de custo
 */
export interface CostEstimate {
  /** Custo de tokens de entrada (USD) */
  inputCost: number;
  /** Custo de tokens de saída (USD) */
  outputCost: number;
  /** Custo total (USD) */
  totalCost: number;
  /** Moeda (sempre USD) */
  currency: 'USD';
  /** Custo formatado para exibição */
  formatted: string;
  /** Indica se o modelo tem preço disponível */
  hasPricing: boolean;
}

/**
 * Cria estimativa vazia (quando não há preços)
 */
function createEmptyEstimate(): CostEstimate {
  return {
    inputCost: 0,
    outputCost: 0,
    totalCost: 0,
    currency: 'USD',
    formatted: 'Preço não disponível',
    hasPricing: false
  };
}

/**
 * Hook para estimar custo de uso de um modelo
 * 
 * Calcula o custo estimado baseado em:
 * - Provider e modelo selecionado
 * - Número de tokens de entrada
 * - Número de tokens de saída esperados
 * 
 * @param provider - Provider do modelo (ex: 'anthropic', 'openai')
 * @param modelId - ID do modelo (ex: 'claude-3-5-sonnet-20241022')
 * @param inputTokens - Número de tokens de entrada
 * @param outputTokens - Número de tokens de saída esperados
 * @returns Estimativa de custo detalhada
 * 
 * @example
 * ```typescript
 * const estimate = useCostEstimate(
 *   'anthropic',
 *   'claude-3-5-sonnet-20241022',
 *   1000, // 1K tokens de entrada
 *   2000  // 2K tokens de saída
 * );
 * 
 * <Typography>
 *   Custo estimado: {estimate.formatted}
 * </Typography>
 * ```
 * 
 * @example
 * ```typescript
 * // Com contador de tokens
 * const inputTokens = useTokenCounter(systemPrompt);
 * const outputTokens = chatConfig.maxTokens || 2048;
 * 
 * const estimate = useCostEstimate(
 *   chatConfig.provider,
 *   chatConfig.model,
 *   inputTokens,
 *   outputTokens
 * );
 * ```
 */
export function useCostEstimate(
  provider: string | null,
  modelId: string | null,
  inputTokens: number,
  outputTokens: number
): CostEstimate {
  // Buscar capabilities para validação
  const { capabilities } = useModelCapabilities(provider, modelId);

  // Buscar preços do modelo (memoizado)
  const pricing = useMemo(
    () => getModelPricing(provider, modelId),
    [provider, modelId]
  );

  // Calcular custo (memoizado)
  return useMemo(() => {
    // Se não há preço, retornar estimativa vazia
    if (!pricing) {
      return createEmptyEstimate();
    }
    
    // Calcular custos usando CostCalculator
    const result = CostCalculator.calculate({
      inputTokens,
      outputTokens,
      pricing
    });
    
    // Formatar para exibição usando CostFormatter
    const formatted = CostFormatter.format(result.totalCost);
    
    return {
      inputCost: result.inputCost,
      outputCost: result.outputCost,
      totalCost: result.totalCost,
      currency: 'USD',
      formatted,
      hasPricing: true
    };
  }, [pricing, inputTokens, outputTokens, capabilities]);
}
