// backend/src/services/ai/handlers/chatHandler.ts

import { logger } from '../../../utils/logger';
import OpenAI from 'openai';
import { ProviderName, AiServiceResponse } from '../types';
import { getProviderConfig } from '../utils/providerUtils';

export async function handleChat(
  messages: any[],
  provider: ProviderName = 'groq'
): Promise<AiServiceResponse> {
  const config = getProviderConfig(provider);

  if (!config.isValidKey) {
    logger.warn(`${provider} API key not configured, using mock response`);
    return {
      response: `⚠️ O provider '${provider}' não está configurado. Configure a API key no .env (${config.keyEnv}).`,
      tokensIn: 0,
      tokensOut: 0,
      model: config.defaultModel
    };
  }

  try {
    if (provider === 'claude') {
      // Claude usa API diferente (implementado em claudeClient.ts)
      const { chatClaude } = await import('../client/claudeClient');
      return chatClaude(messages);
    } else {
      // OpenAI-compatible providers
      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });

      const completion = await client.chat.completions.create({
        model: config.defaultModel,
        messages: messages as any,
      });
  
      const content = completion.choices[0]?.message?.content || '';
      const usage = completion.usage;
  
      return {
        response: content,
        tokensIn: usage?.prompt_tokens || 0,
        tokensOut: usage?.completion_tokens || 0,
        model: completion.model || config.defaultModel
      };
    }
  } catch (error: any) {
    logger.error(`Erro ao chamar ${provider}:`, error.message);
    return {
      response: `❌ Erro ao chamar ${provider}: ${error.message}`,
      tokensIn: 0,
      tokensOut: 0,
      model: config.defaultModel
    };
  }
}