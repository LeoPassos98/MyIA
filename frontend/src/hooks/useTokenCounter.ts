// frontend/src/hooks/useTokenCounter.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * useTokenCounter Hook
 *
 * Hook para estimar a contagem de tokens em um texto.
 * Usa uma estimativa simples baseada em caracteres (~4 caracteres por token).
 *
 * Para contagem mais precisa, considere integrar com bibliotecas como:
 * - tiktoken (OpenAI)
 * - @anthropic-ai/tokenizer (Anthropic)
 *
 * @module hooks/useTokenCounter
 */

import { useMemo } from 'react';

/**
 * Estimativa de tokens por caractere
 * Baseado em médias observadas em modelos de linguagem
 */
const CHARS_PER_TOKEN = 4;

/**
 * Hook para contar tokens em um texto
 * 
 * Usa uma estimativa simples: ~4 caracteres por token.
 * Esta é uma aproximação que funciona razoavelmente bem para textos em inglês e português.
 * 
 * @param text - Texto para contar tokens
 * @returns Número estimado de tokens
 * 
 * @example
 * ```typescript
 * const tokenCount = useTokenCounter(systemPrompt);
 * 
 * <Typography variant="caption">
 *   ~{tokenCount} tokens
 * </Typography>
 * ```
 * 
 * @example
 * ```typescript
 * // Com múltiplos textos
 * const promptTokens = useTokenCounter(systemPrompt);
 * const contextTokens = useTokenCounter(additionalContext);
 * const totalTokens = promptTokens + contextTokens;
 * ```
 */
export function useTokenCounter(text: string): number {
  return useMemo(() => {
    if (!text || text.trim().length === 0) {
      return 0;
    }
    
    // Estimativa simples: dividir caracteres por 4
    return Math.ceil(text.length / CHARS_PER_TOKEN);
  }, [text]);
}

/**
 * Hook para contar tokens em múltiplos textos
 * 
 * @param texts - Array de textos para contar tokens
 * @returns Objeto com contagem individual e total
 * 
 * @example
 * ```typescript
 * const { counts, total } = useMultipleTokenCounter([
 *   systemPrompt,
 *   additionalContext,
 *   userMessage
 * ]);
 * 
 * <Typography>
 *   System: {counts[0]} | Context: {counts[1]} | Message: {counts[2]}
 *   Total: {total} tokens
 * </Typography>
 * ```
 */
export function useMultipleTokenCounter(texts: string[]): {
  counts: number[];
  total: number;
} {
  return useMemo(() => {
    const counts = texts.map(text => {
      if (!text || text.trim().length === 0) {
        return 0;
      }
      return Math.ceil(text.length / CHARS_PER_TOKEN);
    });
    
    const total = counts.reduce((sum, count) => sum + count, 0);
    
    return { counts, total };
  }, [texts]);
}

/**
 * Formata a contagem de tokens para exibição amigável
 * 
 * @param tokenCount - Número de tokens
 * @returns String formatada (ex: "1.2K tokens", "500 tokens")
 * 
 * @example
 * ```typescript
 * const formatted = formatTokenCount(1500); // "1.5K tokens"
 * const formatted2 = formatTokenCount(500); // "500 tokens"
 * ```
 */
export function formatTokenCount(tokenCount: number): string {
  if (tokenCount >= 1000) {
    return `${(tokenCount / 1000).toFixed(1)}K tokens`;
  }
  return `${tokenCount} tokens`;
}

/**
 * Hook combinado que retorna contagem e formatação
 * 
 * @param text - Texto para contar tokens
 * @returns Objeto com contagem e string formatada
 * 
 * @example
 * ```typescript
 * const { count, formatted } = useFormattedTokenCount(systemPrompt);
 * 
 * <Chip label={formatted} size="small" />
 * ```
 */
export function useFormattedTokenCount(text: string): {
  count: number;
  formatted: string;
} {
  const count = useTokenCounter(text);
  const formatted = useMemo(() => formatTokenCount(count), [count]);
  
  return { count, formatted };
}

/**
 * Hook para verificar se o texto excede um limite de tokens
 * 
 * @param text - Texto para verificar
 * @param limit - Limite máximo de tokens
 * @returns Objeto com informações sobre o limite
 * 
 * @example
 * ```typescript
 * const { exceeds, count, remaining, percentage } = useTokenLimit(
 *   systemPrompt,
 *   2000
 * );
 * 
 * {exceeds && (
 *   <Alert severity="warning">
 *     Texto excede o limite em {count - limit} tokens
 *   </Alert>
 * )}
 * ```
 */
export function useTokenLimit(text: string, limit: number): {
  exceeds: boolean;
  count: number;
  remaining: number;
  percentage: number;
} {
  const count = useTokenCounter(text);
  
  return useMemo(() => {
    const exceeds = count > limit;
    const remaining = Math.max(0, limit - count);
    const percentage = limit > 0 ? Math.min(100, (count / limit) * 100) : 0;
    
    return {
      exceeds,
      count,
      remaining,
      percentage
    };
  }, [count, limit]);
}
