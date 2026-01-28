// backend/src/services/ai/certification/__tests__/test-runner-retry.test.ts
// Standards: docs/STANDARDS.md

import { TestRunner } from '../test-runner';
import { TestSpec } from '../types';

describe('TestRunner - Retry Logic', () => {
  let mockProvider: any;
  let testRunner: TestRunner;
  
  beforeEach(() => {
    mockProvider = {
      chat: jest.fn()
    };
    testRunner = new TestRunner(mockProvider, 'test-api-key');
  });
  
  describe('Retry com Rate Limit', () => {
    it('deve fazer retry em caso de rate limit e suceder', async () => {
      let callCount = 0;
      
      const mockTest: TestSpec = {
        id: 'test-rate-limit',
        name: 'Rate Limit Test',
        description: 'Test retry logic with rate limit errors',
        timeout: 30000,
        run: jest.fn().mockImplementation(async () => {
          callCount++;
          if (callCount <= 2) {
            throw new Error('ThrottlingException: Rate limit exceeded');
          }
          return {
            testId: 'test-rate-limit',
            testName: 'Rate Limit Test',
            passed: true,
            latencyMs: 100
          };
        })
      };
      
      const startTime = Date.now();
      const { results, metrics } = await testRunner.runTestsWithRetry(
        'test-model',
        [mockTest]
      );
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].attempts).toBe(3);
      expect(metrics[0].retries).toBe(2);
      expect(metrics[0].errors).toHaveLength(2);
      expect(duration).toBeGreaterThanOrEqual(6000);
      expect(duration).toBeLessThan(8000);
    }, 10000);
    
    it('deve respeitar maxRetries e falhar após 7 tentativas', async () => {
      const mockTest: TestSpec = {
        id: 'test-max-retries',
        name: 'Max Retries Test',
        description: 'Test max retries limit',
        timeout: 30000,
        run: jest.fn().mockRejectedValue(
          new Error('ThrottlingException: Rate limit exceeded')
        )
      };
      
      const { results, metrics } = await testRunner.runTestsWithRetry(
        'test-model',
        [mockTest]
      );
      
      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].attempts).toBe(7);
      expect(metrics[0].retries).toBe(6);
      expect(metrics[0].errors).toHaveLength(7);
    }, 60000);
  });
  
  describe('Erros Não-Retryáveis', () => {
    it('não deve fazer retry para modelo não disponível (404)', async () => {
      const mockTest: TestSpec = {
        id: 'test-not-found',
        name: 'Not Found Test',
        description: 'Test non-retryable error',
        timeout: 30000,
        run: jest.fn().mockRejectedValue(
          new Error('ResourceNotFoundException: Model not found')
        )
      };
      
      const { results, metrics } = await testRunner.runTestsWithRetry(
        'test-model',
        [mockTest]
      );
      
      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].attempts).toBe(1);
      expect(metrics[0].retries).toBe(0);
      expect(metrics[0].errors).toHaveLength(1);
    });
    
    it('não deve fazer retry para erro de autenticação (401)', async () => {
      const mockTest: TestSpec = {
        id: 'test-auth',
        name: 'Auth Test',
        description: 'Test auth error',
        timeout: 30000,
        run: jest.fn().mockRejectedValue(
          new Error('UnauthorizedException: Invalid credentials')
        )
      };
      
      const { metrics } = await testRunner.runTestsWithRetry(
        'test-model',
        [mockTest]
      );
      
      expect(metrics[0].attempts).toBe(1);
      expect(metrics[0].retries).toBe(0);
    });
    
    it('não deve fazer retry para erro de validação (400)', async () => {
      const mockTest: TestSpec = {
        id: 'test-validation',
        name: 'Validation Test',
        description: 'Test validation error',
        timeout: 30000,
        run: jest.fn().mockRejectedValue(
          new Error('ValidationException: Invalid request')
        )
      };
      
      const { metrics } = await testRunner.runTestsWithRetry(
        'test-model',
        [mockTest]
      );
      
      expect(metrics[0].attempts).toBe(1);
      expect(metrics[0].retries).toBe(0);
    });
  });
  
  describe('Métricas de Execução', () => {
    it('deve coletar métricas corretamente em caso de sucesso', async () => {
      const mockTest: TestSpec = {
        id: 'test-metrics',
        name: 'Metrics Test',
        description: 'Test metrics collection',
        timeout: 30000,
        run: jest.fn().mockResolvedValue({
          testId: 'test-metrics',
          testName: 'Metrics Test',
          passed: true,
          latencyMs: 150
        })
      };
      
      const { metrics } = await testRunner.runTestsWithRetry(
        'test-model',
        [mockTest]
      );
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].attempts).toBe(1);
      expect(metrics[0].retries).toBe(0);
      expect(metrics[0].latency).toBeGreaterThan(0);
      expect(metrics[0].totalDuration).toBeGreaterThan(0);
      expect(metrics[0].errors).toHaveLength(0);
    });
    
    it('deve coletar todos os erros durante retries', async () => {
      let callCount = 0;
      const errors = [
        'Error 1: Rate limit',
        'Error 2: Timeout',
        'Error 3: Connection reset'
      ];
      
      const mockTest: TestSpec = {
        id: 'test-error-collection',
        name: 'Error Collection Test',
        description: 'Test error collection',
        timeout: 30000,
        run: jest.fn().mockImplementation(async () => {
          if (callCount < errors.length) {
            const error = errors[callCount];
            callCount++;
            throw new Error(error);
          }
          return {
            testId: 'test-error-collection',
            testName: 'Error Collection Test',
            passed: true,
            latencyMs: 100
          };
        })
      };
      
      const { metrics } = await testRunner.runTestsWithRetry(
        'test-model',
        [mockTest]
      );
      
      expect(metrics[0].errors).toHaveLength(3);
      expect(metrics[0].errors[0]).toContain('Error 1');
      expect(metrics[0].errors[1]).toContain('Error 2');
      expect(metrics[0].errors[2]).toContain('Error 3');
    }, 30000);
  });
  
  describe('Erros de Rede Transientes', () => {
    it('deve fazer retry para ECONNRESET', async () => {
      let callCount = 0;
      
      const mockTest: TestSpec = {
        id: 'test-econnreset',
        name: 'ECONNRESET Test',
        description: 'Test ECONNRESET retry',
        timeout: 30000,
        run: jest.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            const error: any = new Error('Connection reset');
            error.code = 'ECONNRESET';
            throw error;
          }
          return {
            testId: 'test-econnreset',
            testName: 'ECONNRESET Test',
            passed: true,
            latencyMs: 100
          };
        })
      };
      
      const { results, metrics } = await testRunner.runTestsWithRetry(
        'test-model',
        [mockTest]
      );
      
      expect(results[0].passed).toBe(true);
      expect(metrics[0].attempts).toBe(2);
      expect(metrics[0].retries).toBe(1);
    }, 5000);
    
    it('deve fazer retry para ETIMEDOUT', async () => {
      let callCount = 0;
      
      const mockTest: TestSpec = {
        id: 'test-etimedout',
        name: 'ETIMEDOUT Test',
        description: 'Test ETIMEDOUT retry',
        timeout: 30000,
        run: jest.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            const error: any = new Error('Connection timed out');
            error.code = 'ETIMEDOUT';
            throw error;
          }
          return {
            testId: 'test-etimedout',
            testName: 'ETIMEDOUT Test',
            passed: true,
            latencyMs: 100
          };
        })
      };
      
      const { results, metrics } = await testRunner.runTestsWithRetry(
        'test-model',
        [mockTest]
      );
      
      expect(results[0].passed).toBe(true);
      expect(metrics[0].attempts).toBe(2);
      expect(metrics[0].retries).toBe(1);
    }, 5000);
  });
});
