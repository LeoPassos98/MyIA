// backend/src/services/ai/providers/openai.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import OpenAI from 'openai';
import { BaseAIProvider, AIRequestOptions } from './base';
import { StreamChunk } from '../types';
import logger from '../../../utils/logger';

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
      // Nota: OpenAI/Groq não tem top_k direto, usamos top_p como aproximação
      // top_k baixo → top_p baixo (mais focado)
      const topP = options.topK ? Math.min(1, options.topK / 100) : undefined;

      const stream = await client.chat.completions.create({
        model: options.modelId,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens,
        top_p: topP,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no provedor OpenAI';
      logger.error(`[OpenAIProvider] Erro no stream:`, error);
      yield {
        type: 'error',
        error: errorMessage,
      };
    }
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const client = new OpenAI({ apiKey, baseURL: this.baseURL });
      await client.models.list();
      return true;
    } catch (_e) {
      return false;
    }
  }
}
