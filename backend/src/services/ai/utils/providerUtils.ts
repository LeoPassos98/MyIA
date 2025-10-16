// backend/src/services/ai/utils/providerUtils.ts

import { PROVIDERS } from '../config/providers';
import { ProviderName } from '../types';

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