// backend/src/services/ai/providers/bedrock/retry/RetryStrategy.ts

import logger from '../../../../../utils/logger';
import { BackoffCalculator, BackoffConfig } from './BackoffCalculator';

/**
 * Configuração de retry
 */
export interface RetryConfig {
  /** Número máximo de retries (0 = sem retry) */
  maxRetries: number;
  
  /** Configuração de backoff */
  backoff: BackoffConfig;
}

/**
 * Operação que pode ser retried
 */
export interface RetryableOperation<T> {
  /**
   * Função a ser executada (pode lançar erro)
   */
  execute: () => Promise<T>;
  
  /**
   * Determina se o erro deve ser retried
   * @param error Erro que ocorreu
   * @returns true se deve fazer retry
   */
  shouldRetry: (error: unknown) => boolean;
  
  /**
   * Callback executado antes de cada retry (opcional)
   * @param attempt Número da tentativa (0-indexed)
   * @param delay Delay que será aplicado (ms)
   * @param error Erro que causou o retry
   */
  onRetry?: (attempt: number, delay: number, error: unknown) => void | Promise<void>;
  
  /**
   * Callback executado quando todas as tentativas falharem (opcional)
   * @param finalError Último erro que ocorreu
   * @param attempts Número total de tentativas feitas
   */
  onFailure?: (finalError: unknown, attempts: number) => void | Promise<void>;
}

/**
 * Resultado de uma operação com retry
 */
export interface RetryResult<T> {
  /** Se a operação foi bem-sucedida */
  success: boolean;
  
  /** Resultado da operação (se success === true) */
  result?: T;
  
  /** Erro final (se success === false) */
  error?: unknown;
  
  /** Número de tentativas realizadas */
  attempts: number;
  
  /** Tempo total gasto (ms) */
  totalTimeMs: number;
}

/**
 * Utilitário para sleep
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Estratégia de retry com backoff exponencial
 * 
 * **REUTILIZÁVEL** - Pode ser usado em qualquer provider ou serviço
 * 
 * Features:
 * - Backoff exponencial com jitter
 * - Callback antes de cada retry
 * - Callback quando todas as tentativas falharem
 * - Métricas de tentativas e tempo total
 * - Suporte a operações síncronas e assíncronas
 * 
 * @example
 * ```typescript
 * // Uso em Bedrock Provider
 * const strategy = new RetryStrategy({
 *   maxRetries: 2,
 *   backoff: {
 *     initialDelayMs: 1000,
 *     maxDelayMs: 10000,
 *     backoffMultiplier: 2,
 *     jitterPercent: 0.2,
 *   },
 * });
 * 
 * const result = await strategy.executeWithRetry({
 *   execute: () => client.send(command),
 *   shouldRetry: (error) => rateLimitDetector.isRateLimit(error),
 *   onRetry: (attempt, delay) => {
 *     console.log(`Retry ${attempt + 1} após ${delay}ms`);
 *   },
 * });
 * 
 * if (result.success) {
 *   console.log('Success:', result.result);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts');
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Uso em OpenAI Provider
 * const strategy = new RetryStrategy({
 *   maxRetries: 3,
 *   backoff: {
 *     initialDelayMs: 500,
 *     maxDelayMs: 5000,
 *     backoffMultiplier: 2,
 *   },
 * });
 * 
 * const result = await strategy.executeWithRetry({
 *   execute: () => openai.chat.completions.create(...),
 *   shouldRetry: (err) => err.status === 429,
 * });
 * ```
 */
export class RetryStrategy {
  private readonly backoffCalculator: BackoffCalculator;

  constructor(private readonly config: RetryConfig) {
    this.backoffCalculator = new BackoffCalculator(config.backoff);
  }

  /**
   * Executa operação com retry automático
   * 
   * @param operation Operação a ser executada
   * @returns Resultado da operação com métricas
   */
  async executeWithRetry<T>(
    operation: RetryableOperation<T>
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: unknown = null;
    
    // Tentar até maxRetries + 1 (tentativa inicial + retries)
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        logger.debug(`[RetryStrategy] Attempt ${attempt + 1}/${this.config.maxRetries + 1}`);
        
        // Executar operação
        const result = await operation.execute();
        
        // Sucesso!
        const totalTimeMs = Date.now() - startTime;
        logger.info(`✅ [RetryStrategy] Success on attempt ${attempt + 1} (${totalTimeMs}ms)`);
        
        return {
          success: true,
          result,
          attempts: attempt + 1,
          totalTimeMs,
        };
      } catch (error) {
        lastError = error;
        
        // Verificar se deve fazer retry
        const shouldRetry = operation.shouldRetry(error);
        const isLastAttempt = attempt === this.config.maxRetries;
        
        if (!shouldRetry || isLastAttempt) {
          // Não deve fazer retry OU é a última tentativa
          logger.warn(
            `[RetryStrategy] ${shouldRetry ? 'Last attempt failed' : 'Error not retryable'} ` +
            `(attempt ${attempt + 1}/${this.config.maxRetries + 1})`
          );
          break;
        }
        
        // Calcular delay para próximo retry
        const delay = this.backoffCalculator.calculate(attempt);
        
        logger.warn(
          `[RetryStrategy] Attempt ${attempt + 1} failed, retrying in ${delay}ms... ` +
          `(${this.config.maxRetries - attempt} retries remaining)`
        );
        
        // Executar callback de retry (se fornecido)
        if (operation.onRetry) {
          try {
            await operation.onRetry(attempt, delay, error);
          } catch (callbackError) {
            logger.error('[RetryStrategy] Error in onRetry callback:', callbackError);
          }
        }
        
        // Aguardar antes do próximo retry
        await sleep(delay);
      }
    }
    
    // Todas as tentativas falharam
    const totalTimeMs = Date.now() - startTime;
    const attempts = this.config.maxRetries + 1;
    
    logger.error(
      `❌ [RetryStrategy] All ${attempts} attempts failed (${totalTimeMs}ms total)`
    );
    
    // Executar callback de falha (se fornecido)
    if (operation.onFailure) {
      try {
        await operation.onFailure(lastError, attempts);
      } catch (callbackError) {
        logger.error('[RetryStrategy] Error in onFailure callback:', callbackError);
      }
    }
    
    return {
      success: false,
      error: lastError,
      attempts,
      totalTimeMs,
    };
  }

  /**
   * Executa operação com retry e lança erro se falhar
   * 
   * Versão simplificada que lança o último erro em caso de falha
   * 
   * @param operation Operação a ser executada
   * @returns Resultado da operação
   * @throws Último erro se todas as tentativas falharem
   */
  async executeWithRetryOrThrow<T>(
    operation: RetryableOperation<T>
  ): Promise<T> {
    const result = await this.executeWithRetry(operation);
    
    if (result.success && result.result !== undefined) {
      return result.result;
    }
    
    throw result.error || new Error('Operation failed after all retries');
  }

  /**
   * Retorna a configuração atual
   */
  getConfig(): Readonly<RetryConfig> {
    return { ...this.config };
  }

  /**
   * Retorna o calculador de backoff
   */
  getBackoffCalculator(): BackoffCalculator {
    return this.backoffCalculator;
  }
}
