// backend/src/utils/certification/responseBuilder.ts
// Standards: docs/STANDARDS.md
// Responsabilidade: Construção de respostas JSend para certificação

import { jsend } from '../jsend';
import { CertificationResult, ModelCertificationStatus } from '../../services/ai/certification/types';

/**
 * Constrói resposta JSend para certificação bem-sucedida
 * 
 * @param result - Resultado da certificação
 * @returns Resposta JSend de sucesso
 */
export function buildSuccessResponse(result: CertificationResult) {
  return jsend.success({
    message: 'Modelo certificado com sucesso',
    certification: result,
    isAvailable: true
  });
}

/**
 * Constrói resposta JSend para modelo com quality warning
 * 
 * @param result - Resultado da certificação
 * @returns Resposta JSend de sucesso com aviso
 */
export function buildQualityWarningResponse(result: CertificationResult) {
  return jsend.success({
    message: 'Modelo disponível mas com limitações de qualidade',
    certification: result,
    isAvailable: true,
    categorizedError: result.categorizedError
  });
}

/**
 * Constrói resposta JSend para modelo indisponível
 * 
 * @param result - Resultado da certificação
 * @returns Resposta JSend de falha
 */
export function buildUnavailableResponse(result: CertificationResult) {
  const errorMessage = result.categorizedError?.message ||
    (result.results && result.results.length > 0 && result.results[0].error
      ? result.results[0].error
      : 'Modelo indisponível ou falhou nos testes de certificação');
  
  return jsend.fail({
    message: errorMessage,
    certification: result,
    isAvailable: false,
    categorizedError: result.categorizedError
  });
}

/**
 * Constrói resposta JSend baseada no resultado da certificação
 * 
 * @param result - Resultado da certificação
 * @returns Resposta JSend apropriada
 */
export function buildCertificationResponse(result: CertificationResult) {
  // Modelo indisponível
  if (!result.isAvailable) {
    return buildUnavailableResponse(result);
  }
  
  // Modelo com quality warning
  if (result.status === ModelCertificationStatus.QUALITY_WARNING) {
    return buildQualityWarningResponse(result);
  }
  
  // Sucesso completo
  return buildSuccessResponse(result);
}

/**
 * Resolve HTTP status code baseado no resultado
 * 
 * @param result - Resultado da certificação
 * @returns HTTP status code apropriado
 */
export function resolveStatusCode(result: CertificationResult): number {
  // Modelo indisponível: 400 Bad Request
  if (!result.isAvailable) {
    return 400;
  }
  
  // Modelo disponível (com ou sem warning): 200 OK
  return 200;
}

/**
 * Constrói resposta completa com status code e body
 * 
 * @param result - Resultado da certificação
 * @returns Objeto com statusCode e response
 */
export function buildCompleteResponse(result: CertificationResult) {
  return {
    statusCode: resolveStatusCode(result),
    response: buildCertificationResponse(result)
  };
}
