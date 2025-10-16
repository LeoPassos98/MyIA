// backend/src/services/ai/config/providers.ts

import { ProviderConfig, ProviderName } from '../types';

export const PROVIDERS: Record<ProviderName, ProviderConfig> = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    keyEnv: 'OPENAI_API_KEY',
    defaultModel: 'gpt-3.5-turbo',
  },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    defaultModel: 'llama-3.1-8b-instant',
  },
  together: {
    baseURL: 'https://api.together.xyz/v1',
    keyEnv: 'TOGETHER_API_KEY',
    defaultModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  },
  perplexity: {
    baseURL: 'https://api.perplexity.ai',
    keyEnv: 'PERPLEXITY_API_KEY',
    defaultModel: 'llama-3.1-sonar-small-128k-online',
  },
  mistral: {
    baseURL: 'https://api.mistral.ai/v1',
    keyEnv: 'MISTRAL_API_KEY',
    defaultModel: 'mistral-small-latest',
  },
};

export const DEFAULT_PROVIDER: ProviderName = 
  (process.env.API_PROVIDER as ProviderName) || 'groq';