// backend/src/services/ai/certification/orchestration/test-orchestrator.ts
// Standards: docs/STANDARDS.md

import { TestRunner } from '../test-runner';
import { BedrockProvider } from '../../providers/bedrock';
import { TestSpec, TestResult, ProgressCallback } from '../types';
import { logger } from '../../../../utils/logger';

interface TestMetrics {
  retries: number;
  errors: string[];
}

/**
 * Orquestra execução de testes de certificação
 * 
 * Responsabilidades:
 * - Criar provider Bedrock
 * - Executar testes via TestRunner
 * - Gerenciar callback de progresso
 * - Coletar métricas de execução
 * 
 * @example
 * const orchestrator = new TestOrchestrator();
 * const { results, metrics } = await orchestrator.runTests(
 *   'model-id',
 *   tests,
 *   credentials,
 *   onProgress
 * );
 */
export class TestOrchestrator {
  /**
   * Executa testes de certificação com retry e progresso
   * 
   * @param modelId - ID do modelo a testar
   * @param tests - Array de especificações de teste
   * @param credentials - Credenciais AWS
   * @param onProgress - Callback opcional para feedback de progresso
   * @returns Resultados dos testes e métricas
   */
  async runTests(
    modelId: string,
    tests: TestSpec[],
    credentials: { accessKey: string; secretKey: string; region: string },
    onProgress?: ProgressCallback
  ): Promise<{
    results: TestResult[];
    metrics: TestMetrics[];
  }> {
    logger.info('[TestOrchestrator] Iniciando execução de testes', {
      modelId,
      testCount: tests.length,
      region: credentials.region
    });
    
    // Emitir progresso: iniciando testes
    if (onProgress) {
      onProgress({
        type: 'progress',
        current: 0,
        total: tests.length,
        message: `Iniciando ${tests.length} testes de certificação`
      });
    }
    
    // Criar provider Bedrock
    const provider = new BedrockProvider(credentials.region);
    
    // Formato esperado pelo BedrockProvider: ACCESS_KEY:SECRET_KEY
    const apiKey = `${credentials.accessKey}:${credentials.secretKey}`;
    
    // Criar TestRunner
    const runner = new TestRunner(provider, apiKey);
    
    // Contador de testes completados para progresso
    let completedTests = 0;
    
    // Executar testes com retry e callback de progresso
    const { results, metrics } = await runner.runTestsWithRetry(
      modelId,
      tests,
      onProgress ? (testName, status) => {
        // Incrementar contador quando teste completa (passed ou failed)
        if (status === 'passed' || status === 'failed') {
          completedTests++;
        }
        
        // Emitir evento de progresso
        onProgress({
          type: 'progress',
          current: completedTests,
          total: tests.length,
          testName,
          status
        });
      } : undefined
    );
    
    logger.info('[TestOrchestrator] Testes executados', {
      modelId,
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length
    });
    
    return { results, metrics };
  }
}
