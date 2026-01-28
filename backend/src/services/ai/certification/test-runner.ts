// backend/src/services/ai/certification/test-runner.ts
// Standards: docs/STANDARDS.md

import { TestSpec, TestResult } from './types';
import { logger } from '../../../utils/logger';

/**
 * Callback de progresso para testes individuais
 * Chamado quando um teste inicia, passa ou falha
 */
export type TestProgressCallback = (
  testName: string,
  status: 'running' | 'passed' | 'failed'
) => void;

/**
 * Configuração de retry com backoff exponencial
 */
export interface RetryConfig {
  maxRetries: number;      // 6 (padrão)
  initialDelay: number;    // 2000ms
  maxDelay: number;        // 16000ms
  backoffFactor: number;   // 2.0 (exponencial)
}

/**
 * Métricas de execução de teste com retry
 */
export interface TestExecutionMetrics {
  attempts: number;        // Número de tentativas (1-7)
  retries: number;         // Número de retries (0-6)
  totalDuration: number;   // Duração total incluindo retries
  latency: number;         // Latência da tentativa bem-sucedida
  errors: string[];        // Lista de erros encontrados
}

export class TestRunner {
  private readonly retryConfig: RetryConfig = {
    maxRetries: 6,
    initialDelay: 2000,
    maxDelay: 16000,
    backoffFactor: 2.0
  };

  constructor(
    private provider: any,
    private apiKey: string
  ) {}

  /**
   * Executa testes de certificação com callback opcional de progresso
   *
   * @param modelId - ID do modelo a ser testado
   * @param tests - Array de especificações de teste
   * @param onProgress - Callback opcional para feedback de progresso via SSE
   * @returns Array de resultados dos testes
   */
  async runTests(
    modelId: string,
    tests: TestSpec[],
    onProgress?: TestProgressCallback
  ): Promise<TestResult[]> {
    logger.info(`[TestRunner] Executando ${tests.length} testes em paralelo para ${modelId}`);
    const startTime = Date.now();
    
    // Executar todos os testes em paralelo
    const testPromises = tests.map(async (test) => {
      logger.info(`[TestRunner] Iniciando teste ${test.id} para ${modelId}`);
      
      // Emitir progresso: teste iniciando
      if (onProgress) {
        onProgress(test.name, 'running');
      }
      
      try {
        const result = await Promise.race([
          test.run(modelId, this.provider, this.apiKey),
          this.timeout(test.timeout, test.id)
        ]);
        
        logger.info(`[TestRunner] Teste ${test.id} concluído: ${result.passed ? 'PASSOU' : 'FALHOU'}`);
        
        // Emitir progresso: teste concluído
        if (onProgress) {
          onProgress(test.name, result.passed ? 'passed' : 'failed');
        }
        
        return result;
      } catch (error: any) {
        logger.error(`[TestRunner] Erro no teste ${test.id}: ${error.message}`);
        
        // Emitir progresso: teste falhou
        if (onProgress) {
          onProgress(test.name, 'failed');
        }
        
        return {
          testId: test.id,
          testName: test.name,
          passed: false,
          error: error.message || 'Unknown error',
          latencyMs: 0
        };
      }
    });
    
    const results = await Promise.all(testPromises);
    
    const duration = Date.now() - startTime;
    const passedCount = results.filter(r => r.passed).length;
    logger.info(`[TestRunner] Testes concluídos em ${duration}ms (${passedCount}/${results.length} passaram)`);
    
    return results;
  }

  /**
   * Executa testes com retry e coleta de métricas
   * 
   * @param modelId - ID do modelo a ser testado
   * @param tests - Array de especificações de teste
   * @param onProgress - Callback opcional para feedback de progresso via SSE
   * @returns Tupla com resultados dos testes e métricas agregadas
   */
  async runTestsWithRetry(
    modelId: string,
    tests: TestSpec[],
    onProgress?: TestProgressCallback
  ): Promise<{ results: TestResult[], metrics: TestExecutionMetrics[] }> {
    logger.info(`[TestRunner] Executando ${tests.length} testes com retry para ${modelId}`);
    const startTime = Date.now();
    
    const allMetrics: TestExecutionMetrics[] = [];
    
    // Executar todos os testes em paralelo
    const testPromises = tests.map(async (test) => {
      logger.info(`[TestRunner] Iniciando teste ${test.id} para ${modelId}`);
      
      // Emitir progresso: teste iniciando
      if (onProgress) {
        onProgress(test.name, 'running');
      }
      
      try {
        const { result, metrics } = await this.executeTestWithRetry(test, modelId);
        
        logger.info(`[TestRunner] Teste ${test.id} concluído: ${result.passed ? 'PASSOU' : 'FALHOU'} (${metrics.attempts} tentativas, ${metrics.retries} retries)`);
        
        // Emitir progresso: teste concluído
        if (onProgress) {
          onProgress(test.name, result.passed ? 'passed' : 'failed');
        }
        
        allMetrics.push(metrics);
        return result;
      } catch (error: any) {
        logger.error(`[TestRunner] Erro no teste ${test.id}: ${error.message}`);
        
        // Emitir progresso: teste falhou
        if (onProgress) {
          onProgress(test.name, 'failed');
        }
        
        return {
          testId: test.id,
          testName: test.name,
          passed: false,
          error: error.message || 'Unknown error',
          latencyMs: 0
        };
      }
    });
    
    const results = await Promise.all(testPromises);
    
    const duration = Date.now() - startTime;
    const passedCount = results.filter(r => r.passed).length;
    logger.info(`[TestRunner] Testes concluídos em ${duration}ms (${passedCount}/${results.length} passaram)`);
    
    return { results, metrics: allMetrics };
  }

  /**
   * Executa um teste individual com retry e backoff exponencial
   * 
   * @param test - Especificação do teste
   * @param modelId - ID do modelo
   * @returns Resultado do teste e métricas de execução
   */
  private async executeTestWithRetry(
    test: TestSpec,
    modelId: string
  ): Promise<{ result: TestResult, metrics: TestExecutionMetrics }> {
    const metrics: TestExecutionMetrics = {
      attempts: 0,
      retries: 0,
      totalDuration: 0,
      latency: 0,
      errors: []
    };
    
    const startTime = Date.now();
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      metrics.attempts = attempt + 1;
      
      try {
        const attemptStart = Date.now();
        
        // Executar teste com timeout
        const result = await Promise.race([
          test.run(modelId, this.provider, this.apiKey),
          this.timeout(test.timeout, test.id)
        ]);
        
        metrics.latency = Date.now() - attemptStart;
        metrics.totalDuration = Date.now() - startTime;
        
        logger.info(`[TestRunner] Teste ${test.id} sucesso na tentativa ${metrics.attempts}`);
        
        return { result, metrics }; // Sucesso
        
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        metrics.errors.push(errorMsg);
        
        logger.warn(`[TestRunner] Teste ${test.id} falhou na tentativa ${metrics.attempts}: ${errorMsg}`);
        
        // Verificar se deve fazer retry
        if (!this.shouldRetry(error) || attempt === this.retryConfig.maxRetries) {
          metrics.totalDuration = Date.now() - startTime;
          
          logger.error(`[TestRunner] Teste ${test.id} falhou definitivamente após ${metrics.attempts} tentativas`);
          
          // Falha definitiva
          const result: TestResult = {
            testId: test.id,
            testName: test.name,
            passed: false,
            error: errorMsg,
            latencyMs: 0
          };
          
          return { result, metrics };
        }
        
        // Calcular delay e aguardar
        metrics.retries = attempt + 1;
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffFactor, attempt),
          this.retryConfig.maxDelay
        );
        
        logger.warn(`[TestRunner] Retry ${metrics.retries}/${this.retryConfig.maxRetries} após ${delay}ms`, {
          test: test.name,
          error: errorMsg
        });
        
        await this.sleep(delay);
      }
    }
    
    // Nunca deve chegar aqui, mas TypeScript exige
    throw new Error('Unexpected end of retry loop');
  }

  /**
   * Determina se um erro deve ter retry
   * 
   * @param error - Erro capturado
   * @returns true se deve fazer retry
   */
  private shouldRetry(error: any): boolean {
    const errorMsg = error.message || '';
    
    // Erros que DEVEM ter retry (transientes)
    const retryableErrors = [
      'ThrottlingException',
      'ServiceUnavailable',
      'TooManyRequestsException',
      'RequestTimeout',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      '429',
      'Rate limit'
    ];
    
    // Erros que NÃO devem ter retry (permanentes)
    const nonRetryableErrors = [
      'ResourceNotFoundException',
      'UnauthorizedException',
      'ValidationException',
      'ProvisioningRequired',
      'AccessDeniedException',
      'InvalidRequestException',
      'ModelNotSupportedException',
      '401',
      '403',
      '404'
    ];
    
    // Verificar se é erro não-retryável (tem prioridade)
    if (nonRetryableErrors.some(e => errorMsg.includes(e))) {
      logger.debug(`[TestRunner] Erro não-retryável detectado: ${errorMsg}`);
      return false;
    }
    
    // Verificar se é erro retryável
    if (retryableErrors.some(e => errorMsg.includes(e))) {
      logger.debug(`[TestRunner] Erro retryável detectado: ${errorMsg}`);
      return true;
    }
    
    // Por padrão, não fazer retry para erros desconhecidos
    logger.debug(`[TestRunner] Erro desconhecido, não fazendo retry: ${errorMsg}`);
    return false;
  }

  /**
   * Aguarda um período de tempo
   * 
   * @param ms - Milissegundos para aguardar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private timeout(ms: number, testId: string): Promise<TestResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test ${testId} timed out after ${ms}ms`));
      }, ms);
    });
  }
}
