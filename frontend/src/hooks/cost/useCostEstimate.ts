// frontend/src/hooks/cost/useCostEstimate.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * useCostEstimate Hook
 *
 * Hook para estimar o custo de uso de modelos de IA baseado em tokens.
 * Versão v2 que busca preços da API v2 (custos em 1M tokens).
 *
 * @module hooks/cost/useCostEstimate
 */

import { useMemo, useEffect, useState } from 'react';
import { useModelCapabilities } from '../useModelCapabilities';
import { 
  getDeploymentPricing, 
  DeploymentPricing
} from '../../services/deploymentPricingService';
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
  /** Indica se está carregando preços */
  isLoading?: boolean;
}

/**
 * Cria estimativa vazia (quando não há preços)
 */
function createEmptyEstimate(isLoading: boolean = false): CostEstimate {
  return {
    inputCost: 0,
    outputCost: 0,
    totalCost: 0,
    currency: 'USD',
    formatted: isLoading ? 'Carregando...' : 'Preço não disponível',
    hasPricing: false,
    isLoading
  };
}

// Flag para controlar pré-carregamento do cache (lazy initialization)
let cachePreloaded = false;

/**
 * Pré-carrega o cache de deployments de forma lazy
 * Chamado apenas uma vez quando o primeiro hook é usado
 */
async function ensureCachePreloaded(): Promise<void> {
  if (cachePreloaded) return;
  cachePreloaded = true;
  
  try {
    const { preloadDeploymentsCache } = await import('../../services/deploymentPricingService');
    await preloadDeploymentsCache();
  } catch {
    // Silenciar erro - será tratado quando o hook for usado
  }
}

/**
 * Hook para estimar custo de uso de um modelo
 * 
 * Calcula o custo estimado baseado em:
 * - Provider e modelo selecionado
 * - Número de tokens de entrada
 * - Número de tokens de saída esperados
 * 
 * Os preços são buscados da API v2 (/api/v2/deployments) e são
 * expressos em custo por 1M tokens (padrão da indústria).
 * 
 * @param provider - Provider do modelo (ex: 'bedrock', 'anthropic')
 * @param modelId - ID do modelo (ex: 'anthropic.claude-3-5-sonnet-20241022-v2:0')
 * @param inputTokens - Número de tokens de entrada
 * @param outputTokens - Número de tokens de saída esperados
 * @returns Estimativa de custo detalhada
 * 
 * @example
 * ```typescript
 * const estimate = useCostEstimate(
 *   'bedrock',
 *   'anthropic.claude-3-5-sonnet-20241022-v2:0',
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
  // Estado para preços carregados da API
  const [pricing, setPricing] = useState<DeploymentPricing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Buscar capabilities para validação
  const { capabilities } = useModelCapabilities(provider, modelId);

  // Buscar preços da API v2
  useEffect(() => {
    let cancelled = false;
    
    async function loadPricing() {
      setIsLoading(true);
      
      // Garantir que o cache está pré-carregado
      await ensureCachePreloaded();
      
      try {
        const result = await getDeploymentPricing(provider, modelId);
        if (!cancelled) {
          setPricing(result);
        }
      } catch (error) {
        if (!cancelled) {
          setPricing(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    if (provider && modelId) {
      loadPricing();
    } else {
      setPricing(null);
      setIsLoading(false);
    }
    
    return () => {
      cancelled = true;
    };
  }, [provider, modelId]);

  // Calcular custo (memoizado)
  return useMemo(() => {
    // Se está carregando, retornar estimativa de loading
    if (isLoading) {
      return createEmptyEstimate(true);
    }
    
    // Se não há preço, retornar estimativa vazia
    if (!pricing) {
      return createEmptyEstimate(false);
    }
    
    // Calcular custos usando CostCalculator
    // Os preços da API v2 já estão em custo por 1M tokens
    const result = CostCalculator.calculate({
      inputTokens,
      outputTokens,
      pricing: {
        input: pricing.costPer1MInput,
        output: pricing.costPer1MOutput
      }
    });
    
    // Formatar para exibição usando CostFormatter
    const formatted = CostFormatter.format(result.totalCost);
    
    return {
      inputCost: result.inputCost,
      outputCost: result.outputCost,
      totalCost: result.totalCost,
      currency: 'USD',
      formatted,
      hasPricing: true,
      isLoading: false
    };
  }, [pricing, inputTokens, outputTokens, isLoading, capabilities]);
}
