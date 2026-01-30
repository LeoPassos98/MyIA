// backend/src/services/ai/certification/error-categorizer.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity, CategorizedError } from './types';
import { logger } from '../../../utils/logger';

/**
 * Categoriza um erro com base na mensagem
 */
export function categorizeError(error: Error | string): CategorizedError {
  const startTime = Date.now();
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorLower = errorMessage.toLowerCase();
  
  let category: ErrorCategory;
  
  // UNAVAILABLE - Modelo não existe ou não está disponível
  if (
    /model.*(not found|not supported|does not exist|not available)/i.test(errorMessage) ||
    /ResourceNotFoundException|ModelNotFoundException/i.test(errorMessage) ||
    /no such model/i.test(errorLower) ||
    /invalid model/i.test(errorLower) ||
    /model id.*invalid/i.test(errorLower) ||
    /model identifier is invalid/i.test(errorLower) ||
    /provided model.*invalid/i.test(errorLower) ||
    /model.*identifier.*invalid/i.test(errorLower) ||
    /invalid.*identifier/i.test(errorLower)
  ) {
    category = ErrorCategory.UNAVAILABLE;
  }
  // PERMISSION_ERROR - Sem permissão para acessar
  else if (
    /AccessDeniedException/i.test(errorMessage) ||
    /access denied/i.test(errorLower) ||
    /permission denied/i.test(errorLower) ||
    /not authorized/i.test(errorLower) ||
    /insufficient permissions/i.test(errorLower) ||
    /UnauthorizedException/i.test(errorMessage) ||
    /forbidden/i.test(errorLower) ||
    /403/.test(errorMessage)
  ) {
    category = ErrorCategory.PERMISSION_ERROR;
  }
  // AUTHENTICATION_ERROR - Credenciais inválidas
  else if (
    /InvalidAccessKeyId/i.test(errorMessage) ||
    /SignatureDoesNotMatch/i.test(errorMessage) ||
    /invalid credentials/i.test(errorLower) ||
    /authentication failed/i.test(errorLower) ||
    /credentials.*invalid/i.test(errorLower) ||
    /credentials.*expired/i.test(errorLower) ||
    /UnrecognizedClientException/i.test(errorMessage) ||
    /InvalidClientTokenId/i.test(errorMessage)
  ) {
    category = ErrorCategory.AUTHENTICATION_ERROR;
  }
  // RATE_LIMIT - Limite de taxa excedido
  else if (
    /ThrottlingException/i.test(errorMessage) ||
    /rate limit/i.test(errorLower) ||
    /too many requests/i.test(errorLower) ||
    /quota exceeded/i.test(errorLower) ||
    /throttling/i.test(errorLower) ||
    /too many tokens/i.test(errorLower) ||
    /request limit/i.test(errorLower) ||
    /TooManyRequestsException/i.test(errorMessage) ||
    /429/.test(errorMessage)
  ) {
    category = ErrorCategory.RATE_LIMIT;
  }
  // TIMEOUT - Tempo esgotado
  else if (
    /timeout/i.test(errorLower) ||
    /timed out/i.test(errorLower) ||
    /time.*exceeded/i.test(errorLower) ||
    /request timeout/i.test(errorLower) ||
    /TimeoutException/i.test(errorMessage) ||
    /Test.*timed out after \d+ms/.test(errorMessage)
  ) {
    category = ErrorCategory.TIMEOUT;
  }
  // CONFIGURATION_ERROR - Erro de configuração (ex: inference profile necessário)
  else if (
    /with on-demand throughput isn't supported.*inference profile/i.test(errorMessage) ||
    /retry.*with.*inference profile/i.test(errorLower) ||
    /requires.*inference profile/i.test(errorLower) ||
    /inference profile.*required/i.test(errorLower) ||
    /region.*not supported/i.test(errorLower) ||
    /invalid region/i.test(errorLower) ||
    /configuration.*invalid/i.test(errorLower) ||
    /ValidationException/i.test(errorMessage) ||
    /InvalidParameterException/i.test(errorMessage) ||
    /model.*requires.*cross-region/i.test(errorLower)
  ) {
    category = ErrorCategory.CONFIGURATION_ERROR;
  }
  // PROVISIONING_REQUIRED - Modelo requer provisionamento prévio
  else if (
    /on-demand throughput/i.test(errorLower) ||
    /provisioned throughput/i.test(errorLower) ||
    /model access/i.test(errorLower) ||
    /model.*not enabled/i.test(errorLower) ||
    /enable.*model.*access/i.test(errorLower) ||
    /request.*model access/i.test(errorLower) ||
    /provisioning.*required/i.test(errorLower)
  ) {
    category = ErrorCategory.PROVISIONING_REQUIRED;
  }
  // QUALITY_ISSUE - Problema de qualidade (modelo funciona mas não passa em testes)
  else if (
    /response too short/i.test(errorLower) ||
    /invalid json/i.test(errorLower) ||
    /no response/i.test(errorLower) ||
    /empty response/i.test(errorLower) ||
    /no content/i.test(errorLower) ||
    /no chunks received/i.test(errorLower) ||
    /model did not remember context/i.test(errorLower) ||
    /response.*not.*expected format/i.test(errorLower) ||
    /quality.*below threshold/i.test(errorLower)
  ) {
    category = ErrorCategory.QUALITY_ISSUE;
  }
  // NETWORK_ERROR - Erro de rede
  else if (
    /network error/i.test(errorLower) ||
    /connection.*failed/i.test(errorLower) ||
    /connection.*refused/i.test(errorLower) ||
    /connection.*timeout/i.test(errorLower) ||
    /ECONNREFUSED/i.test(errorMessage) ||
    /ENOTFOUND/i.test(errorMessage) ||
    /ETIMEDOUT/i.test(errorMessage) ||
    /socket hang up/i.test(errorLower) ||
    /network.*unreachable/i.test(errorLower)
  ) {
    category = ErrorCategory.NETWORK_ERROR;
  }
  // UNKNOWN_ERROR - Erro desconhecido ou não categorizado
  else {
    category = ErrorCategory.UNKNOWN_ERROR;
  }
  
  const severity = getSeverity(category);
  const suggestedActions = getSuggestedActions(category);
  const isTemporary = isTemporaryError(category);
  const message = createUserFriendlyMessage(category, errorMessage);
  
  const elapsedMs = Date.now() - startTime;
  
  // Log para debug (deve ser < 1ms)
  if (elapsedMs > 1) {
    logger.warn(`Error categorization took ${elapsedMs}ms (expected < 1ms)`, {
      category,
      errorMessage: errorMessage.substring(0, 100)
    });
  }
  
  logger.debug('Error categorized', {
    category,
    severity,
    isTemporary,
    elapsedMs
  });
  
  return {
    category,
    severity,
    message,
    originalError: errorMessage,
    suggestedActions,
    isTemporary
  };
}

/**
 * Obtém severidade baseada na categoria
 */
function getSeverity(category: ErrorCategory): ErrorSeverity {
  const severityMap: Record<ErrorCategory, ErrorSeverity> = {
    [ErrorCategory.UNAVAILABLE]: ErrorSeverity.CRITICAL,
    [ErrorCategory.PERMISSION_ERROR]: ErrorSeverity.CRITICAL,
    [ErrorCategory.AUTHENTICATION_ERROR]: ErrorSeverity.CRITICAL,
    [ErrorCategory.PROVISIONING_REQUIRED]: ErrorSeverity.CRITICAL,
    [ErrorCategory.CONFIGURATION_ERROR]: ErrorSeverity.HIGH,
    [ErrorCategory.RATE_LIMIT]: ErrorSeverity.MEDIUM,
    [ErrorCategory.TIMEOUT]: ErrorSeverity.MEDIUM,
    [ErrorCategory.NETWORK_ERROR]: ErrorSeverity.MEDIUM,
    [ErrorCategory.UNKNOWN_ERROR]: ErrorSeverity.MEDIUM,
    [ErrorCategory.QUALITY_ISSUE]: ErrorSeverity.LOW
  };
  
  return severityMap[category];
}

/**
 * Obtém ações sugeridas baseadas na categoria
 */
function getSuggestedActions(category: ErrorCategory): string[] {
  const actionsMap: Record<ErrorCategory, string[]> = {
    [ErrorCategory.UNAVAILABLE]: [
      'Verificar se o modelo existe no AWS Bedrock',
      'Confirmar disponibilidade na região selecionada',
      'Verificar se o modelo requer Inference Profile',
      'Consultar documentação AWS para nome correto do modelo'
    ],
    [ErrorCategory.PERMISSION_ERROR]: [
      'Adicionar política IAM: bedrock:InvokeModel',
      'Adicionar política IAM: bedrock:InvokeModelWithResponseStream',
      'Verificar se a região está permitida nas políticas',
      'Consultar documentação de permissões AWS Bedrock'
    ],
    [ErrorCategory.AUTHENTICATION_ERROR]: [
      'Verificar Access Key ID e Secret Access Key',
      'Confirmar que credenciais não expiraram',
      'Gerar novas credenciais no AWS IAM',
      'Verificar formato: ACCESS_KEY:SECRET_KEY'
    ],
    [ErrorCategory.PROVISIONING_REQUIRED]: [
      '1. Acesse o AWS Console → Bedrock → Model Access',
      '2. Solicite acesso ao modelo (pode levar até 24h)',
      '3. Ou configure Provisioned Throughput para o modelo',
      '4. Enquanto isso, tente modelos alternativos disponíveis',
      'Documentação: https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html'
    ],
    [ErrorCategory.RATE_LIMIT]: [
      'Aguardar alguns minutos e tentar novamente',
      'Sistema fará retry automático (3 tentativas)',
      'Considerar solicitar aumento de quota na AWS',
      'Espaçar certificações em lote'
    ],
    [ErrorCategory.TIMEOUT]: [
      'Tentar novamente - pode ser temporário',
      'Verificar latência da região AWS',
      'Considerar usar região mais próxima',
      'Modelo pode estar sobrecarregado'
    ],
    [ErrorCategory.CONFIGURATION_ERROR]: [
      'Use prefixo regional no modelId: us.{modelId} ou eu.{modelId}',
      'Exemplo: us.anthropic.claude-sonnet-4-5-20250929-v1:0',
      'Documentação: https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html',
      'Verificar se modelo requer Inference Profile',
      'Confirmar região suportada para o modelo'
    ],
    [ErrorCategory.QUALITY_ISSUE]: [
      '✅ Modelo pode ser usado normalmente',
      'Avaliar se limitações são aceitáveis para seu caso',
      'Testar manualmente com seus prompts',
      'Considerar usar outro modelo se qualidade for crítica'
    ],
    [ErrorCategory.NETWORK_ERROR]: [
      'Verificar conexão com internet',
      'Tentar novamente em alguns instantes',
      'Verificar se AWS está com problemas (status.aws.amazon.com)',
      'Verificar firewall/proxy'
    ],
    [ErrorCategory.UNKNOWN_ERROR]: [
      'Verificar logs detalhados',
      'Tentar novamente',
      'Reportar erro se persistir',
      'Verificar se AWS está com problemas'
    ]
  };
  
  return actionsMap[category];
}

/**
 * Verifica se o erro é temporário
 */
function isTemporaryError(category: ErrorCategory): boolean {
  return [
    ErrorCategory.RATE_LIMIT,
    ErrorCategory.TIMEOUT,
    ErrorCategory.NETWORK_ERROR
  ].includes(category);
}

/**
 * Cria mensagem amigável para o usuário
 */
function createUserFriendlyMessage(category: ErrorCategory, originalError: string): string {
  const messageMap: Record<ErrorCategory, string> = {
    [ErrorCategory.UNAVAILABLE]: 'Modelo não está disponível',
    [ErrorCategory.PERMISSION_ERROR]: 'Sem permissão para acessar o modelo',
    [ErrorCategory.AUTHENTICATION_ERROR]: 'Credenciais AWS inválidas ou expiradas',
    [ErrorCategory.PROVISIONING_REQUIRED]: '❌ Modelo requer provisionamento prévio na sua conta AWS',
    [ErrorCategory.RATE_LIMIT]: 'Limite de taxa excedido - tente novamente em alguns minutos',
    [ErrorCategory.TIMEOUT]: 'Tempo limite excedido - modelo demorou muito para responder',
    [ErrorCategory.CONFIGURATION_ERROR]: 'Problema de configuração do modelo',
    [ErrorCategory.QUALITY_ISSUE]: 'Modelo disponível mas com limitações de qualidade',
    [ErrorCategory.NETWORK_ERROR]: 'Erro de conexão com AWS',
    [ErrorCategory.UNKNOWN_ERROR]: 'Erro desconhecido'
  };
  
  const baseMessage = messageMap[category];
  
  // Para QUALITY_ISSUE, incluir o erro original pois é informativo
  if (category === ErrorCategory.QUALITY_ISSUE) {
    return `${baseMessage}: ${originalError}`;
  }
  
  return baseMessage;
}

/**
 * Verifica se modelo está disponível baseado na categoria
 */
export function isModelAvailable(category: ErrorCategory): boolean {
  // Apenas QUALITY_ISSUE indica que modelo está disponível
  return category === ErrorCategory.QUALITY_ISSUE;
}

/**
 * Determina se deve fazer retry baseado na categoria e número de tentativas
 */
export function shouldRetry(category: ErrorCategory, attemptNumber: number): boolean {
  const retryConfig: Record<ErrorCategory, number> = {
    [ErrorCategory.RATE_LIMIT]: 3,
    [ErrorCategory.TIMEOUT]: 1,
    [ErrorCategory.NETWORK_ERROR]: 2,
    [ErrorCategory.UNAVAILABLE]: 0,
    [ErrorCategory.PERMISSION_ERROR]: 0,
    [ErrorCategory.AUTHENTICATION_ERROR]: 0,
    [ErrorCategory.PROVISIONING_REQUIRED]: 0,
    [ErrorCategory.CONFIGURATION_ERROR]: 0,
    [ErrorCategory.QUALITY_ISSUE]: 0,
    [ErrorCategory.UNKNOWN_ERROR]: 0
  };
  
  const maxRetries = retryConfig[category] || 0;
  return attemptNumber < maxRetries;
}

/**
 * Calcula delay para retry com backoff exponencial
 */
export function getRetryDelay(category: ErrorCategory, attemptNumber: number): number {
  const baseDelays: Record<ErrorCategory, number> = {
    [ErrorCategory.RATE_LIMIT]: 2000,      // 2s, 4s, 8s
    [ErrorCategory.TIMEOUT]: 5000,         // 5s
    [ErrorCategory.NETWORK_ERROR]: 1000,   // 1s, 2s
    [ErrorCategory.UNAVAILABLE]: 0,
    [ErrorCategory.PERMISSION_ERROR]: 0,
    [ErrorCategory.AUTHENTICATION_ERROR]: 0,
    [ErrorCategory.PROVISIONING_REQUIRED]: 0,
    [ErrorCategory.CONFIGURATION_ERROR]: 0,
    [ErrorCategory.QUALITY_ISSUE]: 0,
    [ErrorCategory.UNKNOWN_ERROR]: 0
  };
  
  const baseDelay = baseDelays[category] || 0;
  
  // Backoff exponencial: delay * 2^attemptNumber
  return baseDelay * Math.pow(2, attemptNumber);
}
