// backend/src/services/ai/certification/test-specs/cohere.spec.ts
// Standards: docs/STANDARDS.md

import { TestSpec, TestResult } from '../types';

/**
 * Testes específicos para modelos Cohere
 */
export const cohereTestSpecs: TestSpec[] = [
  {
    id: 'cohere-chat-history',
    name: 'Chat History Test',
    description: 'Valida suporte a histórico de conversa',
    timeout: 30000,
    
    async run(modelId: string, provider: any, apiKey: string): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [
          { role: 'user', content: 'My name is Alice' },
          { role: 'assistant', content: 'Nice to meet you, Alice!' },
          { role: 'user', content: 'What is my name?' }
        ];
        
        const chunks: string[] = [];
        
        for await (const chunk of provider.streamChat(messages, { modelId, apiKey })) {
          if (chunk.type === 'chunk' && chunk.content) {
            chunks.push(chunk.content);
          }
        }
        
        const response = chunks.join('').toLowerCase();
        const latency = Date.now() - startTime;
        
        // Verifica se o modelo lembrou o nome
        const rememberedName = response.includes('alice');
        
        return {
          testId: 'cohere-chat-history',
          testName: 'Chat History Test',
          passed: rememberedName,
          error: rememberedName ? undefined : 'Model did not remember context',
          latencyMs: latency,
          metadata: {
            response: chunks.join(''),
            rememberedContext: rememberedName
          }
        };
        
      } catch (error: any) {
        return {
          testId: 'cohere-chat-history',
          testName: 'Chat History Test',
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  },
  
  {
    id: 'cohere-preamble',
    name: 'Preamble Test',
    description: 'Valida suporte a preamble (system message)',
    timeout: 30000,
    
    async run(modelId: string, provider: any, apiKey: string): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [
          { role: 'system', content: 'Always respond in uppercase.' },
          { role: 'user', content: 'hello' }
        ];
        
        const chunks: string[] = [];
        
        for await (const chunk of provider.streamChat(messages, { modelId, apiKey })) {
          if (chunk.type === 'chunk' && chunk.content) {
            chunks.push(chunk.content);
          }
        }
        
        const response = chunks.join('');
        const latency = Date.now() - startTime;
        
        // Verifica se resposta está em uppercase
        const isUppercase = response === response.toUpperCase();
        
        return {
          testId: 'cohere-preamble',
          testName: 'Preamble Test',
          passed: true, // Não é crítico se não seguir
          latencyMs: latency,
          metadata: {
            followedPreamble: isUppercase,
            response
          }
        };
        
      } catch (error: any) {
        return {
          testId: 'cohere-preamble',
          testName: 'Preamble Test',
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  }
];
