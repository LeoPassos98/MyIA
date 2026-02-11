// frontend/src/hooks/cost/useCostComparison.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * useCostComparison Hook
 *
 * Hook para comparar custos entre múltiplos modelos.
 * Versão v2 que busca preços da API v2 (custos em 1M tokens).
 *
 * @module hooks/cost/useCostComparison
 */

import { useMemo, useEffect, useState } from 'react';
import { CostEstimate } from './useCostEstimate';
import { 
  getActiveDeployments, 
  Deployment
} from '../../services/deploymentPricingService';
import { CostCalculator } from './calculators/CostCalculator';
import { CostFormatter } from './formatters/CostFormatter';

/**
 * Modelo para comparação
 */
export interface ModelForComparison {
  /** Provider do modelo */
  provider: string;
  /** ID do modelo */
  modelId: string;
  /** Nome amigável (opcional) */
  name?: string;
}

/**
 * Resultado da comparação com informações do modelo
 */
export interface CostComparisonResult extends CostEstimate {
  /** Provider do modelo */
  provider: string;
  /** ID do modelo */
  modelId: string;
  /** Nome amigável (opcional) */
  name?: string;
}

/**
 * Opções de ordenação
 */
export type SortBy = 'cost' | 'name' | 'provider';

/**
 * Encontra deployment correspondente ao modelo
 */
function findDeploymentForModel(
  model: ModelForComparison,
  deployments: Deployment[]
): Deployment | null {
  return deployments.find(d => {
    // Match exato pelo deploymentId
    if (d.deploymentId === model.modelId) {
      return true;
    }
    
    // Match pelo provider slug + deploymentId contém modelId
    if (d.provider?.slug === model.provider && d.deploymentId.includes(model.modelId)) {
      return true;
    }
    
    // Match pelo nome do modelo base
    if (d.baseModel?.name.toLowerCase().includes(model.modelId.toLowerCase())) {
      return true;
    }
    
    return false;
  }) || null;
}

/**
 * Hook para comparar custos entre modelos
 * 
 * Calcula custo para cada modelo e retorna array ordenado.
 * Por padrão, ordena por custo (menor primeiro).
 * 
 * Os preços são buscados da API v2 (/api/v2/deployments) e são
 * expressos em custo por 1M tokens (padrão da indústria).
 * 
 * @param models - Array de modelos para comparar
 * @param inputTokens - Tokens de entrada
 * @param outputTokens - Tokens de saída
 * @param sortBy - Critério de ordenação (default: 'cost')
 * @returns Array de estimativas ordenadas
 * 
 * @example
 * ```typescript
 * const comparison = useCostComparison(
 *   [
 *     { provider: 'bedrock', modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Claude 3.5 Sonnet' },
 *     { provider: 'bedrock', modelId: 'anthropic.claude-3-haiku-20240307-v1:0', name: 'Claude 3 Haiku' },
 *   ],
 *   1000,
 *   2000
 * );
 * 
 * comparison.forEach(result => {
 *   console.log(`${result.name}: ${result.formatted}`);
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Comparar modelos disponíveis
 * const availableModels = [
 *   { provider: 'bedrock', modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0' },
 *   { provider: 'bedrock', modelId: 'anthropic.claude-3-haiku-20240307-v1:0' }
 * ];
 * 
 * const comparison = useCostComparison(
 *   availableModels,
 *   inputTokens,
 *   outputTokens,
 *   'cost'
 * );
 * 
 * const cheapest = comparison[0];
 * console.log(`Modelo mais barato: ${cheapest.formatted}`);
 * ```
 */
export function useCostComparison(
  models: ModelForComparison[],
  inputTokens: number,
  outputTokens: number,
  sortBy: SortBy = 'cost'
): CostComparisonResult[] {
  // Estado para deployments carregados da API
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Buscar deployments da API v2
  useEffect(() => {
    let cancelled = false;
    
    async function loadDeployments() {
      setIsLoading(true);
      
      try {
        const result = await getActiveDeployments();
        if (!cancelled) {
          setDeployments(result);
        }
      } catch (error) {
        if (!cancelled) {
          setDeployments([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    loadDeployments();
    
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    // Se está carregando, retornar array vazio
    if (isLoading) {
      return [];
    }
    
    // Calcular custo para cada modelo
    const estimates = models.map(model => {
      const deployment = findDeploymentForModel(model, deployments);
      
      // Se não há preço, retornar estimativa vazia
      if (!deployment) {
        return {
          ...model,
          inputCost: 0,
          outputCost: 0,
          totalCost: 0,
          currency: 'USD' as const,
          formatted: 'Preço não disponível',
          hasPricing: false
        };
      }
      
      // Calcular custos usando CostCalculator
      // Os preços da API v2 já estão em custo por 1M tokens
      const result = CostCalculator.calculate({
        inputTokens,
        outputTokens,
        pricing: {
          input: deployment.costPer1MInput,
          output: deployment.costPer1MOutput
        }
      });
      
      // Formatar usando CostFormatter
      const formatted = CostFormatter.format(result.totalCost);
      
      return {
        ...model,
        inputCost: result.inputCost,
        outputCost: result.outputCost,
        totalCost: result.totalCost,
        currency: 'USD' as const,
        formatted,
        hasPricing: true
      };
    });
    
    // Ordenar baseado no critério
    return sortEstimates(estimates, sortBy);
  }, [models, inputTokens, outputTokens, sortBy, deployments, isLoading]);
}

/**
 * Ordena estimativas baseado no critério
 */
function sortEstimates(
  estimates: CostComparisonResult[],
  sortBy: SortBy
): CostComparisonResult[] {
  const sorted = [...estimates];
  
  switch (sortBy) {
    case 'cost':
      // Ordenar por custo (menor primeiro)
      // Modelos sem preço (hasPricing=false) vão para o final
      // Modelos com preço são ordenados por totalCost
      return sorted.sort((a, b) => {
        // Se ambos não têm preço, manter ordem original
        if (!a.hasPricing && !b.hasPricing) return 0;
        // Se apenas 'a' não tem preço, 'a' vai para o final
        if (!a.hasPricing) return 1;
        // Se apenas 'b' não tem preço, 'b' vai para o final
        if (!b.hasPricing) return -1;
        // Ambos têm preço: ordenar por custo (menor primeiro)
        return a.totalCost - b.totalCost;
      });
      
    case 'name':
      // Ordenar por nome (alfabético)
      return sorted.sort((a, b) => {
        const nameA = a.name || a.modelId;
        const nameB = b.name || b.modelId;
        return nameA.localeCompare(nameB);
      });
      
    case 'provider':
      // Ordenar por provider, depois por custo
      return sorted.sort((a, b) => {
        const providerCompare = a.provider.localeCompare(b.provider);
        if (providerCompare !== 0) return providerCompare;
        
        if (!a.hasPricing && !b.hasPricing) return 0;
        if (!a.hasPricing) return 1;
        if (!b.hasPricing) return -1;
        return a.totalCost - b.totalCost;
      });
      
    default:
      return sorted;
  }
}

/**
 * Hook auxiliar para encontrar modelo mais barato
 * 
 * @param models - Array de modelos
 * @param inputTokens - Tokens de entrada
 * @param outputTokens - Tokens de saída
 * @returns Modelo mais barato ou null
 * 
 * @example
 * ```typescript
 * const cheapest = useCheapestModel(models, 1000, 2000);
 * if (cheapest) {
 *   console.log(`Use ${cheapest.name} por ${cheapest.formatted}`);
 * }
 * ```
 */
export function useCheapestModel(
  models: ModelForComparison[],
  inputTokens: number,
  outputTokens: number
): CostComparisonResult | null {
  const comparison = useCostComparison(models, inputTokens, outputTokens, 'cost');
  
  // Retornar primeiro com preço disponível
  return comparison.find(c => c.hasPricing) || null;
}
