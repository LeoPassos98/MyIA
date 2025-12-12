// backend/src/services/ai/providers/openai.ts
// Standards: docs/STANDARDS.md

import OpenAI from 'openai';
import { BaseAIProvider, AIRequestOptions } from './base';
import { StreamChunk } from '../types';

export class OpenAIProvider extends BaseAIProvider {
  private baseURL?: string;

  constructor(baseURL?: string) {
    super();
    this.baseURL = baseURL;
  }

  async *streamChat(
    messages: any[],
    options: AIRequestOptions
  ): AsyncGenerator<StreamChunk> {
    
    // Instancia o cliente dinamicamente com a chave do usuário
    const client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: this.baseURL, // Importante para Groq/Together/LocalLLM
      dangerouslyAllowBrowser: false,
    });

    try {
      const stream = await client.chat.completions.create({
        model: options.modelId,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield {
            // CORREÇÃO: Mudado de 'content' para 'chunk' conforme seu types.ts
            type: 'chunk', 
            content: content,
          };
        }
      }
    } catch (error: any) {
      console.error(`[OpenAIProvider] Erro no stream:`, error);
      yield {
        type: 'error',
        error: error.message || 'Erro desconhecido no provedor OpenAI',
      };
    }
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const client = new OpenAI({ apiKey, baseURL: this.baseURL });
      await client.models.list();
      return true;
    } catch (e) {
      return false;
    }
  }
}
