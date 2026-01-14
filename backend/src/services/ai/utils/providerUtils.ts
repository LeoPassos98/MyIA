// backend/src/services/ai/utils/providerUtils.ts

import { ProviderName } from '../types';

// Configuração inline temporária
const PROVIDERS: Record<string, any> = {
  claude: {
    keyEnv: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-5-sonnet-20241022',
    baseURL: 'https://api.anthropic.com/v1'
  }
};

export function getProviderConfig(provider: ProviderName) {
  const config = PROVIDERS[provider];
  
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  const apiKey = process.env[config.keyEnv];
  const isValidKey = apiKey && !apiKey.includes('sua-chave');
  
  return { ...config, apiKey, isValidKey };
}

export function getModelForProvider(provider: ProviderName): string {
  const config = PROVIDERS[provider];
  return process.env[`${provider.toUpperCase()}_MODEL`] || config.defaultModel;
}

export function isProviderConfigured(provider: ProviderName): boolean {
  const config = PROVIDERS[provider];
  const apiKey = process.env[config.keyEnv];
  return !!apiKey && !apiKey.includes('sua-chave');
}