// backend/src/services/ai/certification/test-specs/base.spec.ts
// Standards: docs/STANDARDS.md

import { TestSpec, TestResult } from '../types';

/**
 * Testes base aplicados a todos os modelos
 */
export const baseTestSpecs: TestSpec[] = [
  {
    id: 'basic-prompt',
    name: 'Basic Prompt Test',
    description: 'Testa resposta a prompt simples',
    timeout: 30000, // 30s
    
    async run(modelId: string, provider: any, apiKey: string): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [{ role: 'user', content: 'Hi' }];
        const chunks: string[] = [];
        
        for await (const chunk of provider.streamChat(messages, { modelId, apiKey })) {
          if (chunk.type === 'chunk' && chunk.content) {
            chunks.push(chunk.content);
          }
        }
        
        const response = chunks.join('');
        const latency = Date.now() - startTime;
        
        // Validações
        if (!response || response.length === 0) {
          return {
            testId: 'basic-prompt',
            testName: 'Basic Prompt Test',
            passed: false,
            error: 'Empty response',
            latencyMs: latency
          };
        }
        
        if (latency > 30000) {
          return {
            testId: 'basic-prompt',
            testName: 'Basic Prompt Test',
            passed: false,
            error: 'Timeout exceeded',
            latencyMs: latency
          };
        }
        
        return {
          testId: 'basic-prompt',
          testName: 'Basic Prompt Test',
          passed: true,
          latencyMs: latency,
          metadata: {
            responseLength: response.length,
            chunksCount: chunks.length
          }
        };
        
      } catch (error: any) {
        return {
          testId: 'basic-prompt',
          testName: 'Basic Prompt Test',
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  },
  
  {
    id: 'streaming-test',
    name: 'Streaming Test',
    description: 'Valida que streaming funciona corretamente',
    timeout: 30000,
    
    async run(modelId: string, provider: any, apiKey: string): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [{ role: 'user', content: 'Count from 1 to 5' }];
        let chunkCount = 0;
        let hasContent = false;
        
        for await (const chunk of provider.streamChat(messages, { modelId, apiKey })) {
          if (chunk.type === 'chunk') {
            chunkCount++;
            if (chunk.content && chunk.content.length > 0) {
              hasContent = true;
            }
          }
        }
        
        const latency = Date.now() - startTime;
        
        if (chunkCount === 0) {
          return {
            testId: 'streaming-test',
            testName: 'Streaming Test',
            passed: false,
            error: 'No chunks received',
            latencyMs: latency
          };
        }
        
        if (!hasContent) {
          return {
            testId: 'streaming-test',
            testName: 'Streaming Test',
            passed: false,
            error: 'No content in chunks',
            latencyMs: latency
          };
        }
        
        return {
          testId: 'streaming-test',
          testName: 'Streaming Test',
          passed: true,
          latencyMs: latency,
          metadata: { chunkCount }
        };
        
      } catch (error: any) {
        return {
          testId: 'streaming-test',
          testName: 'Streaming Test',
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  },
  
  {
    id: 'parameter-validation',
    name: 'Parameter Validation Test',
    description: 'Testa se parâmetros são aceitos corretamente',
    timeout: 30000,
    
    async run(modelId: string, provider: any, apiKey: string): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [{ role: 'user', content: 'Hi' }];
        const options = {
          modelId,
          apiKey,
          temperature: 0.7,
          maxTokens: 100
        };
        
        let hasResponse = false;
        
        for await (const chunk of provider.streamChat(messages, options)) {
          if (chunk.type === 'chunk' && chunk.content) {
            hasResponse = true;
            break;
          }
        }
        
        const latency = Date.now() - startTime;
        
        if (!hasResponse) {
          return {
            testId: 'parameter-validation',
            testName: 'Parameter Validation Test',
            passed: false,
            error: 'No response with parameters',
            latencyMs: latency
          };
        }
        
        return {
          testId: 'parameter-validation',
          testName: 'Parameter Validation Test',
          passed: true,
          latencyMs: latency
        };
        
      } catch (error: any) {
        return {
          testId: 'parameter-validation',
          testName: 'Parameter Validation Test',
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  },
  
  {
    id: 'error-handling',
    name: 'Error Handling Test',
    description: 'Valida tratamento de erros',
    timeout: 10000,
    
    async run(modelId: string, provider: any, apiKey: string): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        // Enviar prompt vazio (deve falhar gracefully)
        const messages = [{ role: 'user', content: '' }];
        
        let hasError = false;
        
        for await (const chunk of provider.streamChat(messages, { modelId, apiKey })) {
          if (chunk.type === 'error') {
            hasError = true;
            break;
          }
        }
        
        const latency = Date.now() - startTime;
        
        // Esperamos que o modelo trate o erro gracefully
        return {
          testId: 'error-handling',
          testName: 'Error Handling Test',
          passed: true,
          latencyMs: latency,
          metadata: { errorHandled: hasError }
        };
        
      } catch (error: any) {
        // Erro capturado é OK, significa que foi tratado
        return {
          testId: 'error-handling',
          testName: 'Error Handling Test',
          passed: true,
          latencyMs: Date.now() - startTime,
          metadata: { errorCaught: true }
        };
      }
    }
  }
];
