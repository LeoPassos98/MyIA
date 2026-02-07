// backend/src/services/ai/certification/errors/categories/QualityCategory.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../../types';
import { BaseErrorCategory } from '../base/BaseErrorCategory';
import { RegexMatcher } from '../matchers';

/**
 * Categoria: QUALITY_ISSUE
 * Modelo disponível mas com limitações de qualidade
 * Prioridade: 50 (média - modelo funciona)
 * Severidade: LOW
 */
export class QualityCategory extends BaseErrorCategory {
  readonly name = ErrorCategory.QUALITY_ISSUE;
  readonly severity = ErrorSeverity.LOW;
  readonly priority = 50;
  
  constructor() {
    super([
      new RegexMatcher([
        /response too short/i,
        /invalid json/i,
        /no response/i,
        /empty response/i,
        /no content/i,
        /no chunks received/i,
        /model did not remember context/i,
        /response.*not.*expected format/i,
        /quality.*below threshold/i
      ])
    ]);
  }
  
  getSuggestedActions(): string[] {
    return [
      '✅ Modelo pode ser usado normalmente',
      'Avaliar se limitações são aceitáveis para seu caso',
      'Testar manualmente com seus prompts',
      'Considerar usar outro modelo se qualidade for crítica'
    ];
  }
  
  getUserFriendlyMessage(originalError: string): string {
    // Para QUALITY_ISSUE, incluir o erro original pois é informativo
    return `Modelo disponível mas com limitações de qualidade: ${originalError}`;
  }
}
