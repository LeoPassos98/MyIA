// backend/src/services/ai/index.ts

import { ProviderName, StreamChunk, AiServiceResponse } from './types';
import { DEFAULT_PROVIDER } from './config/providers';
import { streamOpenAIChat } from './client/openaiClient';
import { streamClaudeChat } from './client/claudeClient';
import { handleChat } from './handlers/chatHandler';
import { getConfiguredProviders, testProvider } from './handlers/providerHandler';

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

  getConfiguredProviders() {
    return getConfiguredProviders();
  },

  async testProvider(provider: ProviderName) {
    return testProvider(provider);
  },
};

export * from './types';