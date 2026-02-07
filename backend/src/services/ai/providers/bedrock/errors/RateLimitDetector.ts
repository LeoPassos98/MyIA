// backend/src/services/ai/providers/bedrock/errors/RateLimitDetector.ts

import { ThrottlingException } from '@aws-sdk/client-bedrock-runtime';

/**
 * Detecta erros de rate limiting em requisições AWS Bedrock
 * 
 * **REUTILIZÁVEL** - Pode ser usado em qualquer provider AWS
 * 
 * Detecta:
 * - ThrottlingException do AWS SDK
 * - Mensagens de erro com keywords de rate limit
 * - Status HTTP 429 (Too Many Requests)
 * 
 * @example
 * ```typescript
 * const detector = new RateLimitDetector();
 * 
 * try {
 *   await client.send(command);
 * } catch (error) {
 *   if (detector.isRateLimit(error)) {
 *     // Aplicar retry com backoff
 *   }
 * }
 * ```
 */
export class RateLimitDetector {
  /**
   * Keywords que indicam rate limiting em mensagens de erro
   */
  private readonly rateLimitKeywords = [
    'too many tokens',
    'rate limit',
    'throttling',
    'quota exceeded',
    'too many requests',
    'request limit',
    'throttled',
    'rate exceeded',
  ];

  /**
   * Verifica se um erro é de rate limiting
   * 
   * @param error Erro a ser verificado
   * @returns true se for erro de rate limit
   */
  isRateLimit(error: unknown): boolean {
    // Verifica se é ThrottlingException do SDK
    if (error instanceof ThrottlingException) {
      return true;
    }
    
    // Verifica status HTTP 429
    if (this.hasHttpStatus429(error)) {
      return true;
    }
    
    // Verifica mensagens de erro conhecidas
    return this.hasRateLimitKeyword(error);
  }

  /**
   * Verifica se o erro tem status HTTP 429
   */
  private hasHttpStatus429(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }
    
    const awsError = error as any;
    return awsError.$metadata?.httpStatusCode === 429;
  }

  /**
   * Verifica se a mensagem de erro contém keywords de rate limit
   */
  private hasRateLimitKeyword(error: unknown): boolean {
    const errorMessage = this.extractErrorMessage(error);
    if (!errorMessage) {
      return false;
    }
    
    const lowerMessage = errorMessage.toLowerCase();
    return this.rateLimitKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Extrai mensagem de erro de diferentes tipos de erro
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (typeof error === 'object' && error !== null) {
      const anyError = error as any;
      return anyError.message || anyError.Message || '';
    }
    
    return '';
  }

  /**
   * Retorna as keywords usadas para detecção
   */
  getKeywords(): readonly string[] {
    return [...this.rateLimitKeywords];
  }
}
