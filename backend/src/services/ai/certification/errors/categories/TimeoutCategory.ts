// backend/src/services/ai/certification/errors/categories/TimeoutCategory.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../../types';
import { BaseErrorCategory } from '../base/BaseErrorCategory';
import { RegexMatcher } from '../matchers';
import { RetryConfig } from '../types';

/**
 * Categoria: TIMEOUT
 * Tempo limite excedido
 * Prioridade: 45 (média)
 * Severidade: MEDIUM
 * Temporário: SIM (retry automático)
 */
export class TimeoutCategory extends BaseErrorCategory {
  readonly name = ErrorCategory.TIMEOUT;
  readonly severity = ErrorSeverity.MEDIUM;
  readonly priority = 45;
  
  constructor() {
    super([
      new RegexMatcher([
        /timeout/i,
        /timed out/i,
        /time.*exceeded/i,
        /request timeout/i,
        /TimeoutException/i,
        /Test.*timed out after \d+ms/
      ])
    ]);
  }
  
  getSuggestedActions(): string[] {
    return [
      'Tentar novamente - pode ser temporário',
      'Verificar latência da região AWS',
      'Considerar usar região mais próxima',
      'Modelo pode estar sobrecarregado'
    ];
  }
  
  getUserFriendlyMessage(): string {
    return 'Tempo limite excedido - modelo demorou muito para responder';
  }
  
  isTemporary(): boolean {
    return true;
  }
  
  getRetryConfig(): RetryConfig {
    return { 
      maxRetries: 1, 
      baseDelayMs: 5000  // 5s
    };
  }
}
