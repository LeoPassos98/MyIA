// backend/src/services/ai/providers/bedrock/errors/AWSErrorParser.ts

/**
 * Interface para erros do AWS SDK v3
 * Baseado na documentação oficial: https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/ERROR_HANDLING.md
 */
export interface AWSBedrockError extends Error {
  // Metadados da requisição AWS
  $metadata?: {
    httpStatusCode?: number;        // Status HTTP da resposta
    requestId?: string;              // ID único da requisição (x-amzn-requestid)
    extendedRequestId?: string;      // ID estendido (usado em S3)
    cfId?: string;                   // CloudFront Distribution ID
    attempts?: number;               // Número de tentativas realizadas
    totalRetryDelay?: number;        // Delay total de retries em ms
  };
  
  // Tipo de falha: 'client' (erro do cliente) ou 'server' (erro do servidor)
  $fault?: 'client' | 'server';
  
  // Nome do serviço AWS que gerou o erro
  $service?: string;
  
  // Informações sobre retentativas
  $retryable?: {
    throttling?: boolean;            // Se o erro é devido a throttling
  };
  
  // Código do erro (ex: 'ValidationException', 'ThrottlingException')
  Code?: string;
  code?: string;  // Alguns erros usam minúscula
  
  // Tipo do erro
  Type?: string;
  
  // Nome do erro (ex: 'ResourceNotFoundException')
  name: string;
}

/**
 * Erro AWS parseado com metadata estruturada
 */
export interface ParsedAWSError {
  /** Código do erro (ex: 'ValidationException', 'ThrottlingException') */
  code: string;
  
  /** Mensagem de erro */
  message: string;
  
  /** Status HTTP da resposta */
  httpStatus?: number;
  
  /** ID único da requisição AWS */
  requestId?: string;
  
  /** Se o erro é retryable (throttling, server error, etc.) */
  isRetryable: boolean;
  
  /** Se o erro é de rate limiting */
  isRateLimit: boolean;
  
  /** Tipo de falha: 'client' ou 'server' */
  fault?: 'client' | 'server';
  
  /** Nome do serviço AWS */
  service?: string;
  
  /** Metadata adicional do erro */
  metadata: {
    extendedRequestId?: string;
    cfId?: string;
    attempts?: number;
    totalRetryDelay?: number;
    [key: string]: any;
  };
  
  /** Stack trace do erro */
  stack?: string;
}

/**
 * Parse de erros do AWS SDK v3 com extração completa de metadata
 * 
 * **REUTILIZÁVEL** - Pode ser usado em qualquer serviço AWS
 * 
 * Extrai:
 * - Código e mensagem de erro
 * - Metadata da requisição ($metadata)
 * - Informações de retry ($retryable)
 * - Tipo de falha ($fault)
 * - Stack trace
 * 
 * @example
 * ```typescript
 * const parser = new AWSErrorParser();
 * 
 * try {
 *   await client.send(command);
 * } catch (error) {
 *   const parsed = parser.parse(error);
 *   console.log(`Error ${parsed.code}: ${parsed.message}`);
 *   console.log(`Request ID: ${parsed.requestId}`);
 *   console.log(`Is retryable: ${parsed.isRetryable}`);
 * }
 * ```
 */
export class AWSErrorParser {
  /**
   * Parse um erro AWS SDK v3 extraindo toda a metadata
   * 
   * @param error Erro a ser parseado
   * @returns Erro parseado com metadata estruturada
   */
  parse(error: unknown): ParsedAWSError {
    const awsError = this.castToAWSError(error);
    const metadata = awsError.$metadata || {};
    
    return {
      code: this.extractErrorCode(awsError),
      message: awsError.message || 'Unknown AWS error',
      httpStatus: metadata.httpStatusCode,
      requestId: metadata.requestId,
      isRetryable: this.isRetryable(awsError),
      isRateLimit: this.isRateLimit(awsError),
      fault: awsError.$fault,
      service: awsError.$service,
      metadata: {
        extendedRequestId: metadata.extendedRequestId,
        cfId: metadata.cfId,
        attempts: metadata.attempts,
        totalRetryDelay: metadata.totalRetryDelay,
      },
      stack: awsError.stack,
    };
  }

  /**
   * Converte erro desconhecido para AWSBedrockError
   */
  private castToAWSError(error: unknown): AWSBedrockError {
    if (error instanceof Error) {
      return error as AWSBedrockError;
    }
    
    // Erro não é Error - criar Error genérico
    return new Error(String(error)) as AWSBedrockError;
  }

  /**
   * Extrai código do erro (Code, code ou name)
   */
  private extractErrorCode(error: AWSBedrockError): string {
    return error.Code || error.code || error.name || 'UnknownError';
  }

  /**
   * Verifica se o erro é retryable
   */
  private isRetryable(error: AWSBedrockError): boolean {
    // Verifica flag $retryable
    if (error.$retryable?.throttling) {
      return true;
    }
    
    // Server errors (5xx) são geralmente retryable
    if (error.$fault === 'server') {
      return true;
    }
    
    // Throttling é sempre retryable
    if (this.isRateLimit(error)) {
      return true;
    }
    
    return false;
  }

  /**
   * Verifica se o erro é de rate limiting
   */
  private isRateLimit(error: AWSBedrockError): boolean {
    const code = this.extractErrorCode(error);
    const message = error.message?.toLowerCase() || '';
    
    // Códigos conhecidos de throttling
    const throttlingCodes = [
      'ThrottlingException',
      'TooManyRequestsException',
      'RequestLimitExceeded',
      'ProvisionedThroughputExceededException',
    ];
    
    if (throttlingCodes.includes(code)) {
      return true;
    }
    
    // Keywords na mensagem
    const rateLimitKeywords = [
      'throttl',
      'rate limit',
      'too many requests',
      'quota exceeded',
    ];
    
    return rateLimitKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Formata erro parseado para log
   */
  formatForLog(parsed: ParsedAWSError): Record<string, any> {
    return {
      code: parsed.code,
      message: parsed.message,
      httpStatus: parsed.httpStatus,
      requestId: parsed.requestId,
      isRetryable: parsed.isRetryable,
      isRateLimit: parsed.isRateLimit,
      fault: parsed.fault,
      service: parsed.service,
      metadata: parsed.metadata,
    };
  }
}
