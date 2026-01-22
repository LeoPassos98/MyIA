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

export class TestRunner {
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
  
  private timeout(ms: number, testId: string): Promise<TestResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test ${testId} timed out after ${ms}ms`));
      }, ms);
    });
  }
}
