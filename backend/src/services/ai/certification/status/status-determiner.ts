// backend/src/services/ai/certification/status/status-determiner.ts
// Standards: docs/STANDARDS.md

import {
  ModelCertificationStatus,
  CategorizedError,
  ErrorCategory,
  ErrorSeverity
} from '../types';
import { categorizeError } from '../error-categorizer';
import { logger } from '../../../../utils/logger';

/**
 * Determina status de certificação baseado em métricas e erros
 * 
 * Responsabilidades:
 * - Categorizar erros
 * - Determinar status (CERTIFIED, QUALITY_WARNING, FAILED)
 * - Determinar disponibilidade (isAvailable)
 * - Adicionar notas explicativas para erros de provisionamento
 * 
 * Thresholds de Certificação:
 * - >= 80%: CERTIFIED (modelo confiável, mesmo com alguns testes falhando)
 * - 60-79%: QUALITY_WARNING (funcional mas com problemas de qualidade)
 * - < 60%: FAILED (não confiável para uso em produção)
 * 
 * Exceções:
 * - Erros críticos (UNAVAILABLE, PERMISSION_ERROR, etc) sempre resultam em FAILED,
 *   independente do successRate, pois o modelo não pode ser usado.
 * 
 * @example
 * const determiner = new StatusDeterminer();
 * const result = determiner.determine(
 *   'model-id',
 *   85.5,
 *   'ThrottlingException: Rate exceeded',
 *   ['test1', 'test2']
 * );
 */
export class StatusDeterminer {
  /**
   * Determina status de certificação
   * 
   * @param modelId - ID do modelo
   * @param successRate - Taxa de sucesso (0-100)
   * @param lastError - Último erro encontrado (se houver)
   * @param qualityIssues - Array de testes que falharam
   * @returns Status, disponibilidade, erro categorizado e issues atualizados
   */
  determine(
    modelId: string,
    successRate: number,
    lastError: string | null,
    qualityIssues: string[]
  ): {
    status: ModelCertificationStatus;
    isAvailable: boolean;
    isCertified: boolean;
    categorizedError?: CategorizedError;
    overallSeverity?: ErrorSeverity;
    qualityIssues: string[];
  } {
    logger.info('[StatusDeterminer] Determinando status', {
      modelId,
      successRate: successRate.toFixed(1),
      hasError: !!lastError
    });
    
    let categorizedError: CategorizedError | undefined;
    let overallSeverity: ErrorSeverity | undefined;
    let isAvailable = true;
    let status: ModelCertificationStatus;
    let isCertified = false;
    
    // Se há erros, categorizar o mais recente
    if (lastError) {
      categorizedError = categorizeError(lastError);
      overallSeverity = categorizedError.severity;
      
      logger.info('[StatusDeterminer] Erro categorizado', {
        modelId,
        category: categorizedError.category,
        severity: categorizedError.severity,
        isTemporary: categorizedError.isTemporary
      });
    }
    
    // Primeiro, verificar se há erros críticos que impedem o uso do modelo
    if (categorizedError) {
      if (
        categorizedError.category === ErrorCategory.UNAVAILABLE ||
        categorizedError.category === ErrorCategory.PERMISSION_ERROR ||
        categorizedError.category === ErrorCategory.AUTHENTICATION_ERROR ||
        categorizedError.category === ErrorCategory.CONFIGURATION_ERROR ||
        categorizedError.category === ErrorCategory.PROVISIONING_REQUIRED
      ) {
        // Erros críticos: modelo não pode ser usado independente do successRate
        status = ModelCertificationStatus.FAILED;
        isAvailable = false;
        isCertified = false;
        logger.info('[StatusDeterminer] Modelo marcado como FAILED devido a erro crítico', {
          modelId,
          category: categorizedError.category
        });
        
        // Se erro é de provisionamento, adicionar nota explicativa
        if (categorizedError.category === ErrorCategory.PROVISIONING_REQUIRED) {
          qualityIssues.push('⚠️ Modelo requer habilitação prévia na conta AWS');
          qualityIssues.push('📋 Acesse AWS Console → Bedrock → Model Access para solicitar acesso');
          logger.info('[StatusDeterminer] Ação necessária: Habilitar modelo no AWS Console', {
            modelId
          });
        }
      } else {
        // Erros não-críticos: determinar status baseado no successRate
        if (successRate >= 80) {
          // >= 80%: CERTIFIED (modelo confiável mesmo com alguns problemas)
          status = ModelCertificationStatus.CERTIFIED;
          isAvailable = true;
          isCertified = true;
          logger.info('[StatusDeterminer] Modelo CERTIFIED com erros não-críticos', {
            modelId,
            successRate: successRate.toFixed(1)
          });
        } else if (successRate >= 60) {
          // 60-79%: QUALITY_WARNING (funcional mas com problemas)
          status = ModelCertificationStatus.QUALITY_WARNING;
          isAvailable = true;
          isCertified = false;
          logger.info('[StatusDeterminer] Modelo marcado como QUALITY_WARNING', {
            modelId,
            successRate: successRate.toFixed(1)
          });
        } else {
          // < 60%: FAILED (não confiável)
          status = ModelCertificationStatus.FAILED;
          isAvailable = false;
          isCertified = false;
          logger.info('[StatusDeterminer] Modelo marcado como FAILED (baixo successRate)', {
            modelId,
            successRate: successRate.toFixed(1)
          });
        }
      }
    } else {
      // Sem erros categorizados: determinar apenas por successRate
      if (successRate >= 80) {
        // >= 80%: CERTIFIED
        status = ModelCertificationStatus.CERTIFIED;
        isAvailable = true;
        isCertified = true;
        logger.info('[StatusDeterminer] Modelo CERTIFIED', {
          modelId,
          successRate: successRate.toFixed(1)
        });
      } else if (successRate >= 60) {
        // 60-79%: QUALITY_WARNING
        status = ModelCertificationStatus.QUALITY_WARNING;
        isAvailable = true;
        isCertified = false;
        logger.info('[StatusDeterminer] Modelo marcado como QUALITY_WARNING', {
          modelId,
          successRate: successRate.toFixed(1)
        });
      } else {
        // < 60%: FAILED
        status = ModelCertificationStatus.FAILED;
        isAvailable = false;
        isCertified = false;
        logger.info('[StatusDeterminer] Modelo marcado como FAILED', {
          modelId,
          successRate: successRate.toFixed(1)
        });
      }
    }
    
    return {
      status,
      isAvailable,
      isCertified,
      categorizedError,
      overallSeverity,
      qualityIssues
    };
  }
}
