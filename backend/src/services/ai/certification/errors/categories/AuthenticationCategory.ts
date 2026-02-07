// backend/src/services/ai/certification/errors/categories/AuthenticationCategory.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../../types';
import { BaseErrorCategory } from '../base/BaseErrorCategory';
import { RegexMatcher } from '../matchers';

/**
 * Categoria: AUTHENTICATION_ERROR
 * Credenciais AWS inválidas ou expiradas
 * Prioridade: 25 (alta - crítico)
 * Severidade: CRITICAL
 */
export class AuthenticationCategory extends BaseErrorCategory {
  readonly name = ErrorCategory.AUTHENTICATION_ERROR;
  readonly severity = ErrorSeverity.CRITICAL;
  readonly priority = 25;
  
  constructor() {
    super([
      new RegexMatcher([
        /InvalidAccessKeyId/i,
        /SignatureDoesNotMatch/i,
        /invalid credentials/i,
        /authentication failed/i,
        /credentials.*invalid/i,
        /credentials.*expired/i,
        /UnrecognizedClientException/i,
        /InvalidClientTokenId/i
      ])
    ]);
  }
  
  getSuggestedActions(): string[] {
    return [
      'Verificar Access Key ID e Secret Access Key',
      'Confirmar que credenciais não expiraram',
      'Gerar novas credenciais no AWS IAM',
      'Verificar formato: ACCESS_KEY:SECRET_KEY'
    ];
  }
  
  getUserFriendlyMessage(): string {
    return 'Credenciais AWS inválidas ou expiradas';
  }
}
