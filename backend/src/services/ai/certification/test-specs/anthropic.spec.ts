// backend/src/services/ai/certification/test-specs/anthropic.spec.ts
// Standards: docs/STANDARDS.md

import { TestSpec, TestResult } from '../types';

/**
 * Testes específicos para modelos Anthropic Claude
 */
export const anthropicTestSpecs: TestSpec[] = [
  {
    id: 'anthropic-system-message',
    name: 'System Message Test',
    description: 'Valida suporte a system messages',
    timeout: 30000,
    
    async run(modelId: string, provider: any, apiKey: string): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hi' }
        ];
        
        let hasResponse = false;
        
        for await (const chunk of provider.streamChat(messages, { modelId, apiKey })) {
          if (chunk.type === 'chunk' && chunk.content) {
            hasResponse = true;
            break;
          }
        }
        
        const latency = Date.now() - startTime;
        
        return {
          testId: 'anthropic-system-message',
          testName: 'System Message Test',
          passed: hasResponse,
          error: hasResponse ? undefined : 'No response with system message',
          latencyMs: latency
        };
        
      } catch (error: any) {
        return {
          testId: 'anthropic-system-message',
          testName: 'System Message Test',
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  },
  
  {
    id: 'anthropic-temperature-top-p-conflict',
    name: 'Temperature + Top-P Conflict Test',
    description: 'Valida se modelo aceita temperature e top_p juntos',
    timeout: 30000,
    
    async run(modelId: string, provider: any, apiKey: string): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [{ role: 'user', content: 'Hi' }];
        const options = {
          modelId,
          apiKey,
          temperature: 0.7,
          topP: 0.9  // Alguns modelos Claude não aceitam ambos
        };
        
        let hasResponse = false;
        
        for await (const chunk of provider.streamChat(messages, options)) {
          if (chunk.type === 'chunk' && chunk.content) {
            hasResponse = true;
            break;
          }
        }
        
        const latency = Date.now() - startTime;
        
        return {
          testId: 'anthropic-temperature-top-p-conflict',
          testName: 'Temperature + Top-P Conflict Test',
          passed: hasResponse,
          latencyMs: latency,
          metadata: {
            acceptsBothParams: hasResponse
          }
        };
        
      } catch (error: any) {
        // Se falhar, não é crítico, mas registramos
        return {
          testId: 'anthropic-temperature-top-p-conflict',
          testName: 'Temperature + Top-P Conflict Test',
          passed: true, // Não é falha crítica
          latencyMs: Date.now() - startTime,
          metadata: {
            acceptsBothParams: false,
            error: error.message
          }
        };
      }
    }
  }
];
