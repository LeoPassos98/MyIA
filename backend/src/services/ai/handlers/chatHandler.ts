// backend/src/services/ai/handlers/chatHandler.ts

import { logger } from '../../../utils/logger';
import { AppError } from '../../../middleware/errorHandler';
import { ChatMessage, ProviderName } from '../types';
import { createClient } from '../client/openaiClient';
import { getProviderConfig, getModelForProvider } from '../utils/providerUtils';
import {
  getMockResponseMessage,
  getQuotaExceededMessage,
  getInvalidKeyMessage,
  getRateLimitMessage,
} from '../utils/errorMessages';

export async function handleChat(
  messages: ChatMessage[],
  provider: ProviderName
): Promise<string> {
  const client = createClient(provider);
  const config = getProviderConfig(provider);
  
  if (!client) {
    logger.warn(`${provider} API key not configured, using mock response`);
    return getMockResponseMessage(provider, config);
  }

  try {
    const model = getModelForProvider(provider);
    
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new AppError('No response from AI', 500);
    }

    logger.info(`${provider.toUpperCase()} response received`, { 
      tokens: response.usage?.total_tokens,
      model
    });

    return content;
  } catch (error: any) {
    logger.error(`${provider.toUpperCase()} API error:`, error);
    return handleChatError(error, provider, config.keyEnv);
  }
}

function handleChatError(error: any, provider: ProviderName, keyEnv: string): string {
  // Erro de quota
  if (error.status === 429 || error.code === 'insufficient_quota') {
    return getQuotaExceededMessage(provider);
  }

  // Erro de autenticação
  if (error.status === 401) {
    return getInvalidKeyMessage(provider, keyEnv);
  }

  // Rate limit
  if (error.code === 'rate_limit_exceeded') {
    return getRateLimitMessage();
  }

  // Erro genérico
  throw new AppError(`Failed to get AI response from ${provider}`, 500);
}