// backend/src/services/ai/certification/errors/categories/PermissionCategory.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../../types';
import { BaseErrorCategory } from '../base/BaseErrorCategory';
import { RegexMatcher, ErrorCodeMatcher } from '../matchers';

/**
 * Categoria: PERMISSION_ERROR
 * Sem permissão para acessar o modelo
 * Prioridade: 20 (alta - crítico)
 * Severidade: CRITICAL
 */
export class PermissionCategory extends BaseErrorCategory {
  readonly name = ErrorCategory.PERMISSION_ERROR;
  readonly severity = ErrorSeverity.CRITICAL;
  readonly priority = 20;
  
  constructor() {
    super([
      new RegexMatcher([
        /AccessDeniedException/i,
        /access denied/i,
        /permission denied/i,
        /not authorized/i,
        /insufficient permissions/i,
        /UnauthorizedException/i,
        /forbidden/i
      ]),
      new ErrorCodeMatcher(['403'])
    ]);
  }
  
  getSuggestedActions(): string[] {
    return [
      'Adicionar política IAM: bedrock:InvokeModel',
      'Adicionar política IAM: bedrock:InvokeModelWithResponseStream',
      'Verificar se a região está permitida nas políticas',
      'Consultar documentação de permissões AWS Bedrock'
    ];
  }
  
  getUserFriendlyMessage(): string {
    return 'Sem permissão para acessar o modelo';
  }
}
