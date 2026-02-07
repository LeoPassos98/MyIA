// backend/src/services/ai/certification/errors/categories/UnknownCategory.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../../types';
import { BaseErrorCategory } from '../base/BaseErrorCategory';

/**
 * Categoria: UNKNOWN_ERROR
 * Erro desconhecido ou não categorizado (fallback)
 * Prioridade: 999 (última opção)
 * Severidade: MEDIUM
 */
export class UnknownCategory extends BaseErrorCategory {
  readonly name = ErrorCategory.UNKNOWN_ERROR;
  readonly severity = ErrorSeverity.MEDIUM;
  readonly priority = 999;
  
  constructor() {
    // Sem matchers - esta categoria é usada como fallback
    super([]);
  }
  
  /**
   * Sempre retorna false pois é categoria de fallback
   * Não deve fazer matching direto
   */
  matches(): boolean {
    return false;
  }
  
  getSuggestedActions(): string[] {
    return [
      'Verificar logs detalhados',
      'Tentar novamente',
      'Reportar erro se persistir',
      'Verificar se AWS está com problemas'
    ];
  }
  
  getUserFriendlyMessage(): string {
    return 'Erro desconhecido';
  }
}
