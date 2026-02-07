// backend/src/services/ai/certification/errors/categories/RateLimitCategory.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../../types';
import { BaseErrorCategory } from '../base/BaseErrorCategory';
import { RegexMatcher, ErrorCodeMatcher } from '../matchers';
import { RetryConfig } from '../types';

/**
 * Categoria: RATE_LIMIT
 * Limite de taxa excedido
 * Prioridade: 40 (média)
 * Severidade: MEDIUM
 * Temporário: SIM (retry automático)
 */
export class RateLimitCategory extends BaseErrorCategory {
  readonly name = ErrorCategory.RATE_LIMIT;
  readonly severity = ErrorSeverity.MEDIUM;
  readonly priority = 40;
  
  constructor() {
    super([
      new RegexMatcher([
        /ThrottlingException/i,
        /rate limit/i,
        /too many requests/i,
        /quota exceeded/i,
        /throttling/i,
        /too many tokens/i,
        /request limit/i,
        /TooManyRequestsException/i
      ]),
      new ErrorCodeMatcher(['429'])
    ]);
  }
  
  getSuggestedActions(): string[] {
    return [
      'Aguardar alguns minutos e tentar novamente',
      'Sistema fará retry automático (3 tentativas)',
      'Considerar solicitar aumento de quota na AWS',
      'Espaçar certificações em lote'
    ];
  }
  
  getUserFriendlyMessage(): string {
    return 'Limite de taxa excedido - tente novamente em alguns minutos';
  }
  
  isTemporary(): boolean {
    return true;
  }
  
  getRetryConfig(): RetryConfig {
    return { 
      maxRetries: 3, 
      baseDelayMs: 2000  // 2s, 4s, 8s (backoff exponencial)
    };
  }
}
