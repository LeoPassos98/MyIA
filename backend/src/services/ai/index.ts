// backend/src/services/ai/index.ts

import { ProviderName, StreamChunk, AiServiceResponse } from './types';
import { DEFAULT_PROVIDER } from './config/providers';
import { streamOpenAIChat } from './client/openaiClient';
import { streamClaudeChat } from './client/claudeClient';
import { handleChat } from './handlers/chatHandler';
import { getConfiguredProviders, testProvider } from './handlers/providerHandler';
import { getEmbedding, getEmbeddingsBatch, EmbeddingResponse } from './client/azureEmbeddingClient';

export const aiService = {
  /**
   * Modo STREAMING (novo): retorna um gerador de chunks
   */
  stream(
    messages: any[],
    provider?: ProviderName
  ): AsyncGenerator<StreamChunk> {
    const selectedProvider = provider || 'groq';
    console.log(`Iniciando stream com provider: ${selectedProvider}`);

    switch (selectedProvider) {
      case 'openai':
      case 'groq':
      case 'together':
      case 'perplexity':
      case 'mistral':
        return streamOpenAIChat(messages, selectedProvider);

      case 'claude':
        return streamClaudeChat(messages);

      default:
        // Gerador "burro" que só retorna um erro
        async function* errorStream() {
          yield {
            type: 'error' as const,
            error: `Provider ${selectedProvider} não suportado para streaming`,
          };
        }
        return errorStream();
    }
  },

  /**
   * Modo BLOQUEANTE (legacy): mantido para compatibilidade
   */
  async chat(
    messages: any[],
    provider: ProviderName = DEFAULT_PROVIDER
  ): Promise<AiServiceResponse> {
    return handleChat(messages, provider);
  },

  /**
   * Modo "TRADUTOR/CONTADOR" (V9.2)
   * Converte texto em vetor + retorna custo calculado
   */
  async embed(text: string): Promise<EmbeddingResponse | null> {
    return getEmbedding(text);
  },

  /**
   * Modo "TRADUTOR EM LOTE" (V9.2)
   * Converte múltiplos textos em vetores + retorna custos
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResponse[]> {
    return getEmbeddingsBatch(texts);
  },

  getConfiguredProviders() {
    return getConfiguredProviders();
  },

  async testProvider(provider: ProviderName) {
    return testProvider(provider);
  },
};

// Exportar interface para uso externo
export type { EmbeddingResponse };

export * from './types';