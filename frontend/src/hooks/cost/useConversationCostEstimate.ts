// frontend/src/hooks/cost/useConversationCostEstimate.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * useConversationCostEstimate Hook
 *
 * Hook para estimar custo de uma conversa completa.
 * Agrega tokens de múltiplas mensagens e calcula custo total.
 *
 * @module hooks/cost/useConversationCostEstimate
 */

import { useMemo } from 'react';
import { useCostEstimate, CostEstimate } from './useCostEstimate';
import { TokenCalculator, Message } from './calculators/TokenCalculator';

/**
 * Hook para estimar custo de uma conversa completa
 * 
 * Considera múltiplas mensagens e respostas.
 * Agrega tokens por role (user/system → input, assistant → output).
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
 * 
 * console.log(estimate.formatted); // "$0.0398"
 * ```
 * 
 * @example
 * ```typescript
 * // Com histórico de conversa
 * const messages = conversation.map(msg => ({
 *   role: msg.role,
 *   tokens: msg.tokenCount || 0
 * }));
 * 
 * const estimate = useConversationCostEstimate(
 *   provider,
 *   modelId,
 *   messages
 * );
 * 
 * <Typography>
 *   Custo da conversa: {estimate.formatted}
 * </Typography>
 * ```
 */
export function useConversationCostEstimate(
  provider: string | null,
  modelId: string | null,
  messages: Message[]
): CostEstimate {
  // Agregar tokens de todas as mensagens (memoizado)
  const { inputTokens, outputTokens } = useMemo(() => {
    return TokenCalculator.aggregateFromMessages(messages);
  }, [messages]);
  
  // Delegar cálculo para useCostEstimate
  return useCostEstimate(provider, modelId, inputTokens, outputTokens);
}
