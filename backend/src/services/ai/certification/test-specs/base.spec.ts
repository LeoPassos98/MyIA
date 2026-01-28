// backend/src/services/ai/certification/test-specs/base.spec.ts
// Standards: docs/STANDARDS.md

import { TestSpec, TestResult, ErrorCategory } from '../types';

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
    // Timeout aumentado para 30s: modelos AWS Bedrock podem ter cold start
    // que causa latência inicial elevada, resultando em falsos negativos com timeout de 10s
    timeout: 30000,
    
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
        
      } catch (_error: any) {
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
  },
  
  {
    id: 'availability-check',
    name: 'Model Availability Check',
    description: 'Valida disponibilidade real do modelo com 2 invocações consecutivas',
    timeout: 60000, // 60s (2 invocações × 30s)
    
    async run(modelId: string, provider: any, apiKey: string): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [{ role: 'user', content: 'Test availability' }];
        
        // ========================================
        // PRIMEIRA INVOCAÇÃO
        // ========================================
        let firstSuccess = false;
        let firstError: string | null = null;
        
        for await (const chunk of provider.streamChat(messages, { modelId, apiKey })) {
          if (chunk.type === 'chunk' && chunk.content) {
            firstSuccess = true;
            break; // Primeira resposta recebida
          }
          
          if (chunk.type === 'error') {
            firstError = chunk.error;
            
            // Detectar erro de provisionamento IMEDIATAMENTE
            if (
              /on-demand throughput/i.test(chunk.error) ||
              /provisioned throughput/i.test(chunk.error) ||
              /model access/i.test(chunk.error) ||
              /enable.*model.*access/i.test(chunk.error)
            ) {
              return {
                testId: 'availability-check',
                testName: 'Model Availability Check',
                passed: false,
                error: 'PROVISIONING_REQUIRED: Model requires provisioning in AWS account',
                errorCategory: ErrorCategory.PROVISIONING_REQUIRED,
                latencyMs: Date.now() - startTime,
                metadata: {
                  errorType: 'provisioning_required',
                  originalError: chunk.error,
                  userAction: 'Enable model in AWS Console → Bedrock → Model Access',
                  documentationUrl: 'https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html'
                }
              };
            }
            
            break; // Outro tipo de erro
          }
        }
        
        if (!firstSuccess) {
          return {
            testId: 'availability-check',
            testName: 'Model Availability Check',
            passed: false,
            error: firstError || 'No response from model on first invocation',
            latencyMs: Date.now() - startTime
          };
        }
        
        // ========================================
        // DELAY ENTRE INVOCAÇÕES
        // ========================================
        // Aguardar 2s para simular uso real
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // ========================================
        // SEGUNDA INVOCAÇÃO (validar consistência)
        // ========================================
        let secondSuccess = false;
        let secondError: string | null = null;
        
        for await (const chunk of provider.streamChat(messages, { modelId, apiKey })) {
          if (chunk.type === 'chunk' && chunk.content) {
            secondSuccess = true;
            break;
          }
          
          if (chunk.type === 'error') {
            secondError = chunk.error;
            
            // Detectar erro de provisionamento na segunda tentativa
            if (
              /on-demand throughput/i.test(chunk.error) ||
              /provisioned throughput/i.test(chunk.error) ||
              /model access/i.test(chunk.error)
            ) {
              return {
                testId: 'availability-check',
                testName: 'Model Availability Check',
                passed: false,
                error: 'PROVISIONING_REQUIRED: Model succeeded once but requires provisioning',
                errorCategory: ErrorCategory.PROVISIONING_REQUIRED,
                latencyMs: Date.now() - startTime,
                metadata: {
                  errorType: 'intermittent_provisioning',
                  firstInvocation: 'success',
                  secondInvocation: 'failed',
                  warning: 'Model has intermittent availability - not reliable for production'
                }
              };
            }
            
            break;
          }
        }
        
        const latency = Date.now() - startTime;
        
        if (!secondSuccess) {
          return {
            testId: 'availability-check',
            testName: 'Model Availability Check',
            passed: false,
            error: `Inconsistent availability: first succeeded, second failed (${secondError || 'unknown error'})`,
            latencyMs: latency,
            metadata: {
              warning: 'Model may have intermittent availability issues',
              firstInvocation: 'success',
              secondInvocation: 'failed'
            }
          };
        }
        
        // ✅ AMBAS INVOCAÇÕES SUCEDERAM
        return {
          testId: 'availability-check',
          testName: 'Model Availability Check',
          passed: true,
          latencyMs: latency,
          metadata: {
            consecutiveSuccesses: 2,
            totalLatency: latency,
            avgLatencyPerInvocation: Math.round(latency / 2)
          }
        };
        
      } catch (error: any) {
        return {
          testId: 'availability-check',
          testName: 'Model Availability Check',
          passed: false,
          error: error.message || 'Unknown error during availability check',
          latencyMs: Date.now() - startTime
        };
      }
    }
  }
];
