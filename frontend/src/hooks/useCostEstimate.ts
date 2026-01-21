// frontend/src/hooks/useCostEstimate.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * useCostEstimate Hook
 *
 * Hook para estimar o custo de uso de modelos de IA baseado em tokens.
 * Usa preços hardcoded para os principais modelos.
 *
 * Para preços dinâmicos do backend, considere integrar com endpoint de pricing.
 *
 * @module hooks/useCostEstimate
 */

import { useMemo } from 'react';
import { useModelCapabilities } from './useModelCapabilities';

/**
 * Tabela de preços por modelo (USD por 1M tokens)
 * Fonte: Documentação oficial dos providers (atualizado em Jan 2026)
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'openai:gpt-4-turbo': { input: 10.0, output: 30.0 },
  'openai:gpt-4': { input: 30.0, output: 60.0 },
  'openai:gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  
  // Anthropic
  'anthropic:claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'anthropic:claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'anthropic:claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
  'anthropic:claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  
  // Amazon Bedrock - Anthropic
  'amazon:anthropic.claude-3-5-sonnet-20241022-v2:0': { input: 3.0, output: 15.0 },
  'amazon:anthropic.claude-3-opus-20240229-v1:0': { input: 15.0, output: 75.0 },
  'amazon:anthropic.claude-3-sonnet-20240229-v1:0': { input: 3.0, output: 15.0 },
  'amazon:anthropic.claude-3-haiku-20240307-v1:0': { input: 0.25, output: 1.25 },
  
  // Amazon Bedrock - Amazon
  'amazon:amazon.titan-text-express-v1': { input: 0.2, output: 0.6 },
  'amazon:amazon.titan-text-lite-v1': { input: 0.15, output: 0.2 },
  
  // Cohere
  'cohere:command-r-plus': { input: 3.0, output: 15.0 },
  'cohere:command-r': { input: 0.5, output: 1.5 },
  
  // Groq (gratuito com limites)
  'groq:llama-3.1-70b-versatile': { input: 0.0, output: 0.0 },
  'groq:llama-3.1-8b-instant': { input: 0.0, output: 0.0 },
  'groq:mixtral-8x7b-32768': { input: 0.0, output: 0.0 },
};

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

  return useMemo(() => {
    // Construir fullModelId
    const fullModelId = provider && modelId ? `${provider}:${modelId}` : null;
    
    // Buscar preços do modelo
    const pricing = fullModelId ? MODEL_PRICING[fullModelId] : null;
    
    // Se não há preço, retornar zero
    if (!pricing) {
      return {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        currency: 'USD',
        formatted: 'Preço não disponível',
        hasPricing: false
      };
    }
    
    // Calcular custos (preços são por 1M tokens)
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;
    
    // Formatar para exibição
    const formatted = formatCost(totalCost);
    
    return {
      inputCost,
      outputCost,
      totalCost,
      currency: 'USD',
      formatted,
      hasPricing: true
    };
  }, [provider, modelId, inputTokens, outputTokens, capabilities]);
}

/**
 * Formata o custo para exibição amigável
 * 
 * @param cost - Custo em USD
 * @returns String formatada (ex: "$0.0015", "$1.50", "< $0.0001")
 */
function formatCost(cost: number): string {
  if (cost === 0) {
    return 'Gratuito';
  }
  
  if (cost < 0.0001) {
    return '< $0.0001';
  }
  
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  
  if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  }
  
  return `$${cost.toFixed(2)}`;
}

/**
 * Hook para estimar custo de uma conversa completa
 * 
 * Considera múltiplas mensagens e respostas
 * 
 * @param provider - Provider do modelo
 * @param modelId - ID do modelo
 * @param messages - Array de mensagens com contagem de tokens
 * @returns Estimativa de custo total
 * 
 * @example
 * ```typescript
 * const estimate = useConversationCostEstimate(
 *   'anthropic',
 *   'claude-3-5-sonnet-20241022',
 *   [
 *     { role: 'user', tokens: 100 },
 *     { role: 'assistant', tokens: 500 },
 *     { role: 'user', tokens: 150 },
 *     { role: 'assistant', tokens: 600 }
 *   ]
 * );
 * ```
 */
export function useConversationCostEstimate(
  provider: string | null,
  modelId: string | null,
  messages: Array<{ role: 'user' | 'assistant'; tokens: number }>
): CostEstimate {
  // Calcular total de tokens de entrada e saída
  const { inputTokens, outputTokens } = useMemo(() => {
    let input = 0;
    let output = 0;
    
    messages.forEach(msg => {
      if (msg.role === 'user') {
        input += msg.tokens;
      } else {
        output += msg.tokens;
      }
    });
    
    return { inputTokens: input, outputTokens: output };
  }, [messages]);
  
  return useCostEstimate(provider, modelId, inputTokens, outputTokens);
}

/**
 * Hook para comparar custos entre modelos
 * 
 * @param models - Array de modelos para comparar
 * @param inputTokens - Tokens de entrada
 * @param outputTokens - Tokens de saída
 * @returns Array de estimativas ordenadas por custo
 * 
 * @example
 * ```typescript
 * const comparison = useCostComparison(
 *   [
 *     { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' },
 *     { provider: 'anthropic', modelId: 'claude-3-haiku-20240307' },
 *     { provider: 'openai', modelId: 'gpt-3.5-turbo' }
 *   ],
 *   1000,
 *   2000
 * );
 * ```
 */
export function useCostComparison(
  models: Array<{ provider: string; modelId: string; name?: string }>,
  inputTokens: number,
  outputTokens: number
): Array<CostEstimate & { provider: string; modelId: string; name?: string }> {
  return useMemo(() => {
    const estimates = models.map(model => {
      const fullModelId = `${model.provider}:${model.modelId}`;
      const pricing = MODEL_PRICING[fullModelId];
      
      if (!pricing) {
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
      
      const inputCost = (inputTokens / 1_000_000) * pricing.input;
      const outputCost = (outputTokens / 1_000_000) * pricing.output;
      const totalCost = inputCost + outputCost;
      
      return {
        ...model,
        inputCost,
        outputCost,
        totalCost,
        currency: 'USD' as const,
        formatted: formatCost(totalCost),
        hasPricing: true
      };
    });
    
    // Ordenar por custo (menor primeiro)
    return estimates.sort((a, b) => a.totalCost - b.totalCost);
  }, [models, inputTokens, outputTokens]);
}
