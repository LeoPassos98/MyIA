// backend/src/services/ai/certification/errors/categories/NetworkCategory.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../../types';
import { BaseErrorCategory } from '../base/BaseErrorCategory';
import { RegexMatcher } from '../matchers';
import { RetryConfig } from '../types';

/**
 * Categoria: NETWORK_ERROR
 * Erro de conexão com AWS
 * Prioridade: 60 (baixa - genérico)
 * Severidade: MEDIUM
 * Temporário: SIM (retry automático)
 */
export class NetworkCategory extends BaseErrorCategory {
  readonly name = ErrorCategory.NETWORK_ERROR;
  readonly severity = ErrorSeverity.MEDIUM;
  readonly priority = 60;
  
  constructor() {
    super([
      new RegexMatcher([
        /network error/i,
        /connection.*failed/i,
        /connection.*refused/i,
        /connection.*timeout/i,
        /connection.*reset/i,
        /connection timed out/i,
        /ECONNREFUSED/i,
        /ENOTFOUND/i,
        /ETIMEDOUT/i,
        /ECONNRESET/i,
        /socket hang up/i,
        /network.*unreachable/i
      ])
    ]);
  }
  
  getSuggestedActions(): string[] {
    return [
      'Verificar conexão com internet',
      'Tentar novamente em alguns instantes',
      'Verificar se AWS está com problemas (status.aws.amazon.com)',
      'Verificar firewall/proxy'
    ];
  }
  
  getUserFriendlyMessage(): string {
    return 'Erro de conexão com AWS';
  }
  
  isTemporary(): boolean {
    return true;
  }
  
  getRetryConfig(): RetryConfig {
    return { 
      maxRetries: 2, 
      baseDelayMs: 1000  // 1s, 2s
    };
  }
}
