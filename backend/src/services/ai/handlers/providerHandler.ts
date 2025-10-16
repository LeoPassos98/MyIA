// backend/src/services/ai/handlers/providerHandler.ts

import { PROVIDERS } from '../config/providers';
import { ProviderName, ProviderInfo, TestResult } from '../types';
import { createClient } from '../client/openaiClient';
import { getProviderConfig, getModelForProvider } from '../utils/providerUtils';

export function getConfiguredProviders(): ProviderInfo[] {
  return Object.keys(PROVIDERS).map((name) => {
    const provider = name as ProviderName;
    const config = PROVIDERS[provider];
    const apiKey = process.env[config.keyEnv];
    const isConfigured = !!apiKey && !apiKey.includes('sua-chave');
    
    return {
      name,
      configured: isConfigured,
      model: getModelForProvider(provider),
    };
  });
}

export async function testProvider(provider: ProviderName): Promise<TestResult> {
  const config = getProviderConfig(provider);
  
  if (!config.isValidKey) {
    return {
      success: false,
      message: `API key not configured. Set ${config.keyEnv} in .env file`,
    };
  }

  const client = createClient(provider);
  if (!client) {
    return { success: false, message: 'Failed to create client' };
  }

  try {
    const startTime = Date.now();
    
    await client.models.list();
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      message: 'Connection successful',
      responseTime,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Connection failed',
    };
  }
}