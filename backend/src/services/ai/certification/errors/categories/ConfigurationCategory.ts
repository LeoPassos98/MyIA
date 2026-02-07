// backend/src/services/ai/certification/errors/categories/ConfigurationCategory.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../../types';
import { BaseErrorCategory } from '../base/BaseErrorCategory';
import { RegexMatcher } from '../matchers';

/**
 * Categoria: CONFIGURATION_ERROR
 * Problema de configuração do modelo (ex: inference profile necessário)
 * Prioridade: 30 (alta - pode sobrepor outros)
 * Severidade: HIGH
 */
export class ConfigurationCategory extends BaseErrorCategory {
  readonly name = ErrorCategory.CONFIGURATION_ERROR;
  readonly severity = ErrorSeverity.HIGH;
  readonly priority = 30;
  
  constructor() {
    super([
      new RegexMatcher([
        /with on-demand throughput isn't supported.*inference profile/i,
        /retry.*with.*inference profile/i,
        /requires.*inference profile/i,
        /inference profile.*required/i,
        /region.*not supported/i,
        /invalid region/i,
        /configuration.*invalid/i,
        /ValidationException/i,
        /InvalidParameterException/i,
        /model.*requires.*cross-region/i
      ])
    ]);
  }
  
  getSuggestedActions(): string[] {
    return [
      'Use prefixo regional no modelId: us.{modelId} ou eu.{modelId}',
      'Exemplo: us.anthropic.claude-sonnet-4-5-20250929-v1:0',
      'Documentação: https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html',
      'Verificar se modelo requer Inference Profile',
      'Confirmar região suportada para o modelo'
    ];
  }
  
  getUserFriendlyMessage(): string {
    return 'Problema de configuração do modelo';
  }
}
