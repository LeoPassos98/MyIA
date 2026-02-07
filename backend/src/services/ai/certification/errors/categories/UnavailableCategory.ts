// backend/src/services/ai/certification/errors/categories/UnavailableCategory.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../../types';
import { BaseErrorCategory } from '../base/BaseErrorCategory';
import { RegexMatcher } from '../matchers';

/**
 * Categoria: UNAVAILABLE
 * Modelo não existe ou não está disponível na região
 * Prioridade: 10 (mais alta - mais específico)
 * Severidade: CRITICAL
 */
export class UnavailableCategory extends BaseErrorCategory {
  readonly name = ErrorCategory.UNAVAILABLE;
  readonly severity = ErrorSeverity.CRITICAL;
  readonly priority = 10;
  
  constructor() {
    super([
      new RegexMatcher([
        /model.*(not found|not supported|does not exist|not available)/i,
        /ResourceNotFoundException/i,
        /ModelNotFoundException/i,
        /no such model/i,
        /invalid model/i,
        /model id.*invalid/i,
        /model identifier is invalid/i,
        /provided model.*invalid/i,
        /model.*identifier.*invalid/i,
        /invalid.*identifier/i
      ])
    ]);
  }
  
  getSuggestedActions(): string[] {
    return [
      'Verificar se o modelo existe no AWS Bedrock',
      'Confirmar disponibilidade na região selecionada',
      'Verificar se o modelo requer Inference Profile',
      'Consultar documentação AWS para nome correto do modelo'
    ];
  }
  
  getUserFriendlyMessage(): string {
    return 'Modelo não está disponível';
  }
}
