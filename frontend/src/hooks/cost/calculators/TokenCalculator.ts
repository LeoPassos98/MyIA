// frontend/src/hooks/cost/calculators/TokenCalculator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Token Calculator Module
 *
 * Utilitários para agregação e estimativa de tokens.
 * Usado principalmente para calcular custos de conversas completas.
 *
 * @module hooks/cost/calculators/TokenCalculator
 */

/**
 * Mensagem com contagem de tokens
 */
export interface Message {
  /** Role da mensagem */
  role: 'user' | 'assistant' | 'system';
  /** Número de tokens da mensagem */
  tokens: number;
}

/**
 * Resultado da agregação de tokens
 */
export interface TokenAggregation {
  /** Total de tokens de entrada (user + system) */
  inputTokens: number;
  /** Total de tokens de saída (assistant) */
  outputTokens: number;
  /** Total geral de tokens */
  totalTokens: number;
}

/**
 * Calculadora de tokens
 * 
 * Classe estática para agregação e estimativa de tokens.
 */
export class TokenCalculator {
  /**
   * Agrega tokens de múltiplas mensagens
   * 
   * Separa tokens por role:
   * - user/system → inputTokens
   * - assistant → outputTokens
   * 
   * @param messages - Array de mensagens com contagem de tokens
   * @returns Agregação de tokens
   * 
   * @example
   * ```typescript
   * const messages = [
   *   { role: 'user', tokens: 100 },
   *   { role: 'assistant', tokens: 500 },
   *   { role: 'user', tokens: 150 },
   *   { role: 'assistant', tokens: 600 }
   * ];
   * 
   * const result = TokenCalculator.aggregateFromMessages(messages);
   * console.log(result.inputTokens);  // 250
   * console.log(result.outputTokens); // 1100
   * ```
   */
  static aggregateFromMessages(messages: Message[]): TokenAggregation {
    let inputTokens = 0;
    let outputTokens = 0;
    
    messages.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'system') {
        inputTokens += msg.tokens;
      } else if (msg.role === 'assistant') {
        outputTokens += msg.tokens;
      }
    });
    
    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    };
  }
  
  /**
   * Estima tokens de saída baseado em ratio
   * 
   * Útil quando não se sabe quantos tokens de saída haverá.
   * 
   * @param inputTokens - Tokens de entrada
   * @param ratio - Ratio de output (ex: 2.0 = 2x input)
   * @returns Tokens de saída estimados
   * 
   * @example
   * ```typescript
   * // Estimar que resposta será 1.5x o input
   * const outputTokens = TokenCalculator.estimateOutputTokens(1000, 1.5);
   * console.log(outputTokens); // 1500
   * ```
   */
  static estimateOutputTokens(inputTokens: number, ratio: number = 1.0): number {
    return Math.round(inputTokens * ratio);
  }
  
  /**
   * Calcula ratio médio de output/input de uma conversa
   * 
   * Útil para estimar custos futuros baseado em histórico.
   * 
   * @param messages - Array de mensagens
   * @returns Ratio médio (output/input)
   * 
   * @example
   * ```typescript
   * const ratio = TokenCalculator.calculateAverageRatio(messages);
   * console.log(`Modelo responde ${ratio}x o tamanho do input`);
   * ```
   */
  static calculateAverageRatio(messages: Message[]): number {
    const aggregation = this.aggregateFromMessages(messages);
    
    if (aggregation.inputTokens === 0) {
      return 1.0; // Default ratio
    }
    
    return aggregation.outputTokens / aggregation.inputTokens;
  }
  
  /**
   * Agrupa tokens por role
   * 
   * @param messages - Array de mensagens
   * @returns Mapa de role → total de tokens
   * 
   * @example
   * ```typescript
   * const byRole = TokenCalculator.groupByRole(messages);
   * console.log(byRole.user);      // 250
   * console.log(byRole.assistant); // 1100
   * console.log(byRole.system);    // 50
   * ```
   */
  static groupByRole(messages: Message[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    messages.forEach(msg => {
      if (!grouped[msg.role]) {
        grouped[msg.role] = 0;
      }
      grouped[msg.role] += msg.tokens;
    });
    
    return grouped;
  }
  
  /**
   * Calcula estatísticas de tokens de uma conversa
   * 
   * @param messages - Array de mensagens
   * @returns Estatísticas detalhadas
   * 
   * @example
   * ```typescript
   * const stats = TokenCalculator.calculateStats(messages);
   * console.log(`Média: ${stats.average} tokens/mensagem`);
   * console.log(`Maior: ${stats.max} tokens`);
   * ```
   */
  static calculateStats(messages: Message[]) {
    if (messages.length === 0) {
      return {
        count: 0,
        total: 0,
        average: 0,
        min: 0,
        max: 0
      };
    }
    
    const tokens = messages.map(m => m.tokens);
    const total = tokens.reduce((sum, t) => sum + t, 0);
    
    return {
      count: messages.length,
      total,
      average: total / messages.length,
      min: Math.min(...tokens),
      max: Math.max(...tokens)
    };
  }
}
