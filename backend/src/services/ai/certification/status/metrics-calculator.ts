// backend/src/services/ai/certification/status/metrics-calculator.ts
// Standards: docs/STANDARDS.md

import { TestResult } from '../types';
import { logger } from '../../../../utils/logger';

/**
 * Calcula métricas de certificação baseado em resultados de testes
 * 
 * Responsabilidades:
 * - Calcular testsPassed e testsFailed
 * - Calcular successRate
 * - Calcular avgLatencyMs
 * - Extrair qualityIssues e failureReasons
 * 
 * @example
 * const calculator = new MetricsCalculator();
 * const metrics = calculator.calculate(testResults);
 * // Retorna: { testsPassed, testsFailed, successRate, avgLatencyMs, ... }
 */
export class MetricsCalculator {
  /**
   * Calcula métricas de certificação
   * 
   * @param testResults - Array de resultados de testes
   * @returns Métricas calculadas
   */
  calculate(testResults: TestResult[]): {
    testsPassed: number;
    testsFailed: number;
    successRate: number;
    avgLatencyMs: number;
    qualityIssues: string[];
    failureReasons: Array<{
      testId: string;
      testName: string;
      error: string;
    }>;
    lastError: string | null;
  } {
    logger.info('[MetricsCalculator] Calculando métricas', {
      totalTests: testResults.length
    });
    
    // Calcular testes passados e falhados
    const testsPassed = testResults.filter(r => r.passed).length;
    const testsFailed = testResults.filter(r => !r.passed).length;
    const successRate = (testsPassed / testResults.length) * 100;
    
    // Calcular latência média (apenas testes que passaram)
    const latencies = testResults
      .filter(r => r.passed && r.latencyMs > 0)
      .map(r => r.latencyMs);
    const avgLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
    
    // Coletar testes que falharam para o campo qualityIssues
    const qualityIssues = testResults
      .filter(r => !r.passed)
      .map(r => r.testName);
    
    // Coletar e categorizar erros
    const failureReasons = testResults
      .filter(r => !r.passed && r.error)
      .map(r => ({
        testId: r.testId,
        testName: r.testName,
        error: r.error!
      }));
    
    const lastError = failureReasons.length > 0
      ? failureReasons[failureReasons.length - 1].error
      : null;
    
    logger.info('[MetricsCalculator] Métricas calculadas', {
      testsPassed,
      testsFailed,
      successRate: successRate.toFixed(1),
      avgLatencyMs,
      qualityIssuesCount: qualityIssues.length
    });
    
    return {
      testsPassed,
      testsFailed,
      successRate,
      avgLatencyMs,
      qualityIssues,
      failureReasons,
      lastError
    };
  }
}
