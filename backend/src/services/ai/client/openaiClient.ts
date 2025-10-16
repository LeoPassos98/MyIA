// backend/src/services/ai/client/openaiClient.ts

import OpenAI from 'openai';
import { ProviderName } from '../types';
import { getProviderConfig } from '../utils/providerUtils';

export function createClient(provider: ProviderName): OpenAI | null {
  const config = getProviderConfig(provider);
  
  if (!config.isValidKey) {
    return null;
  }
  
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}