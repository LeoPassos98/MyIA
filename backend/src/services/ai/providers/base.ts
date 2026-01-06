// backend/src/services/ai/providers/base.ts
// Standards: docs/STANDARDS.md

import { StreamChunk } from '../types';

export interface AIRequestOptions {
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  apiKey: string;
}

/**
 * Interface base que todo driver de IA deve implementar.
 * Isso garante que o Factory possa trocar OpenAI por Anthropic sem quebrar o sistema.
 */
export abstract class BaseAIProvider {
  /**
   * Gera uma resposta em stream.
   */
  abstract streamChat(
    messages: any[],
    options: AIRequestOptions
  ): AsyncGenerator<StreamChunk>;

  /**
   * (Opcional) Valida se a chave de API é válida fazendo uma chamada leve.
   */
  abstract validateKey(apiKey: string): Promise<boolean>;
}
