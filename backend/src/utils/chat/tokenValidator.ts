// backend/src/utils/chat/tokenValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { StreamChunk } from '../../services/ai/types';

/**
 * Limites conhecidos por provider/modelo (Groq free tier)
 */
const GROQ_FREE_LIMITS: Record<string, number> = {
  'llama-3.1-8b-instant': 6000,
  'llama-3.3-70b-versatile': 12000,
  'default': 6000
};

/**
 * Validador de tokens para prevenir erros de limite
 */
export const tokenValidator = {
  /**
   * Valida se o total de tokens está dentro do limite do modelo
   * Envia warning via SSE se próximo do limite (>90%)
   */
  validate(
    totalTokens: number,
    provider: string,
    model: string,
    writeSSE: (data: StreamChunk) => void
  ): void {
    if (provider !== 'groq') {
      return; // Validação apenas para Groq por enquanto
    }

    const estimatedLimit = GROQ_FREE_LIMITS[model] || GROQ_FREE_LIMITS['default'];
    const threshold = estimatedLimit * 0.9;

    if (totalTokens > threshold) {
      writeSSE({
        type: 'debug',
        log: `⚠️ AVISO: Contexto com ${totalTokens} tokens (limite estimado: ${estimatedLimit}). Pode falhar!`
      });
    }
  },

  /**
   * Retorna o limite estimado para um modelo específico
   */
  getLimit(provider: string, model: string): number | null {
    if (provider !== 'groq') {
      return null;
    }
    return GROQ_FREE_LIMITS[model] || GROQ_FREE_LIMITS['default'];
  }
};
