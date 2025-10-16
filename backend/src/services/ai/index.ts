// backend/src/services/ai/index.ts

import { ChatMessage, ProviderName } from './types';
import { DEFAULT_PROVIDER } from './config/providers';
import { handleChat } from './handlers/chatHandler';
import { getConfiguredProviders, testProvider } from './handlers/providerHandler';

export const aiService = {
  async chat(messages: ChatMessage[], provider: ProviderName = DEFAULT_PROVIDER): Promise<string> {
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