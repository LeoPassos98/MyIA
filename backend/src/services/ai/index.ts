// backend/src/services/ai/index.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { StreamChunk } from './types';
import { AIProviderFactory } from './providers/factory';
import { getEmbedding, getEmbeddingsBatch, EmbeddingResponse } from './client/azureEmbeddingClient';
import { prisma } from '../../lib/prisma';

export interface AIStreamOptions {
  providerSlug: string;
  modelId: string;
  userId: string;
  temperature?: number;
  topK?: number;
  maxTokens?: number;
}

export const aiService = {
  /**
   * Modo STREAMING (Modular V2)
   * Usa a Factory e o Banco de Dados.
   */
  async *stream(
    messages: any[],
    options: AIStreamOptions
  ): AsyncGenerator<StreamChunk> {
    
    console.log(`[AI Service] Stream init: ${options.providerSlug} / ${options.modelId}`);

    try {
      const provider = await AIProviderFactory.getProviderInstance(options.providerSlug);

      const providerRecord = await prisma.aIProvider.findUnique({
        where: { slug: options.providerSlug }
      });

      if (!providerRecord) {
        yield { type: 'error', error: `Provider ${options.providerSlug} não encontrado.` };
        return;
      }

      let apiKey = "";
      try {
        apiKey = await AIProviderFactory.getApiKey(options.userId, providerRecord.id);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Erro ao obter API key';
        yield { type: 'error', error: errorMessage };
        return;
      }

      const streamGenerator = provider.streamChat(messages, {
        modelId: options.modelId,
        apiKey: apiKey,
        maxTokens: options.maxTokens || 4000,
        temperature: options.temperature ?? 0.7,
        topK: options.topK
      });

      for await (const chunk of streamGenerator) {
        yield chunk;
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno no serviço de IA';
      console.error(`[AI Service] Erro fatal:`, error);
      yield {
        type: 'error',
        error: errorMessage,
      };
    }
  },

  // Mantendo métodos de Embedding (Azure/OpenAI)
  async embed(text: string): Promise<EmbeddingResponse | null> {
    return getEmbedding(text);
  },

  async embedBatch(texts: string[]): Promise<EmbeddingResponse[]> {
    return getEmbeddingsBatch(texts);
  },
  
  // Método legado mantido para evitar quebra de contratos antigos se houver
  async chat(_messages: any[], _providerSlug: string) {
     // Implementação simplificada se necessária, ou erro
     throw new Error("Use aiService.stream para chat.");
  }
};

// Exportar interface para uso externo
export type { EmbeddingResponse };

export * from './types';