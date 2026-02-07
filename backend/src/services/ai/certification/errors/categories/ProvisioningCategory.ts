// backend/src/services/ai/certification/errors/categories/ProvisioningCategory.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../../types';
import { BaseErrorCategory } from '../base/BaseErrorCategory';
import { RegexMatcher } from '../matchers';

/**
 * Categoria: PROVISIONING_REQUIRED
 * Modelo requer provisionamento prévio na conta AWS
 * Prioridade: 35 (alta - específico)
 * Severidade: CRITICAL
 */
export class ProvisioningCategory extends BaseErrorCategory {
  readonly name = ErrorCategory.PROVISIONING_REQUIRED;
  readonly severity = ErrorSeverity.CRITICAL;
  readonly priority = 35;
  
  constructor() {
    super([
      new RegexMatcher([
        /on-demand throughput/i,
        /provisioned throughput/i,
        /model access/i,
        /model.*not enabled/i,
        /enable.*model.*access/i,
        /request.*model access/i,
        /provisioning.*required/i
      ])
    ]);
  }
  
  getSuggestedActions(): string[] {
    return [
      '1. Acesse o AWS Console → Bedrock → Model Access',
      '2. Solicite acesso ao modelo (pode levar até 24h)',
      '3. Ou configure Provisioned Throughput para o modelo',
      '4. Enquanto isso, tente modelos alternativos disponíveis',
      'Documentação: https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html'
    ];
  }
  
  getUserFriendlyMessage(): string {
    return '❌ Modelo requer provisionamento prévio na sua conta AWS';
  }
}
