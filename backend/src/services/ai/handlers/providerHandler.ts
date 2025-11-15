// backend/src/services/ai/handlers/providerHandler.ts

import OpenAI from 'openai';
import { ProviderName } from '../types';
import { getProviderConfig } from '../utils/providerUtils';

// Exportar interface para uso externo
export interface ConfiguredProvider {
  name: ProviderName;
  isConfigured: boolean;
  model: string;
}

export function getConfiguredProviders(): ConfiguredProvider[] {
  const providerNames: ProviderName[] = [
    'openai', 
    'groq', 
    'together', 
    'perplexity', 
    'mistral', 
    'claude'
  ];

  return providerNames.map((provider) => {
    const config = getProviderConfig(provider);
    return {
      name: provider,
      isConfigured: !!config.isValidKey,
      model: config.defaultModel,
    };
  });
}

export async function testProvider(provider: ProviderName): Promise<{
  success: boolean;
  message: string;
  model?: string;
}> {
  const config = getProviderConfig(provider);

  if (!config.isValidKey) {
    return {
      success: false,
      message: `Provider '${provider}' não configurado. Configure ${config.keyEnv} no .env`,
    };
  }

  try {
    const startTime = Date.now();

    if (provider === 'claude') {
      const { chatClaude } = await import('../client/claudeClient');
      const response = await chatClaude([
        { role: 'user', content: 'Diga apenas "OK"' }
      ]);
      
      const elapsed = Date.now() - startTime;
      
      return {
        success: true,
        message: `✅ ${provider} funcionando! (${elapsed}ms)`,
        model: response.model,
      };
    } else {
      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });

      const completion = await client.chat.completions.create({
        model: config.defaultModel,
        messages: [{ role: 'user', content: 'Diga apenas "OK"' }],
      });

      const elapsed = Date.now() - startTime;

      return {
        success: true,
        message: `✅ ${provider} funcionando! (${elapsed}ms)`,
        model: completion.model,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `❌ Erro ao testar ${provider}: ${error.message}`,
    };
  }
}