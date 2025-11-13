// backend/src/services/ai/handlers/chatHandler.ts

import { logger } from '../../../utils/logger';
import { AppError } from '../../../middleware/errorHandler';
import { ChatMessage, ProviderName, AiServiceResponse } from '../types';
import { createClient } from '../client/openaiClient';
import { callClaudeAPI } from '../client/claudeClient'; // ← NOVO IMPORT
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
): Promise<AiServiceResponse> {

  // Se for Claude, usar handler específico
  if (provider === 'claude') {
    return handleClaudeChat(messages);
  }

  const client = createClient(provider);
  const config = getProviderConfig(provider);
  
  if (!client) {
    logger.warn(`${provider} API key not configured, using mock response`);
    return {
      response: getMockResponseMessage(provider, config),
      tokensIn: 0,
      tokensOut: 0,
      model: getModelForProvider(provider),
    };
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
    const usage = response.usage;
    const modelUsed = response.model;

    if (!content) {
      throw new AppError('No response from AI', 500);
    }

    logger.info(`${provider.toUpperCase()} response received`, { 
      tokens: usage?.total_tokens,
      model: modelUsed
    });

    const standardizedResponse: AiServiceResponse = {
      response: content,
      tokensIn: usage?.prompt_tokens || 0,
      tokensOut: usage?.completion_tokens || 0,
      model: modelUsed,
    };

    return standardizedResponse;

  } catch (error: any) {
    logger.error(`${provider.toUpperCase()} API error:`, error);
    throw new AppError(handleChatError(error, provider, config.keyEnv), 500);
  }
}

// ← NOVA FUNÇÃO: Handler específico para Claude
async function handleClaudeChat(
  messages: ChatMessage[]
): Promise<AiServiceResponse> {
  const config = getProviderConfig('claude');
  
  if (!config.isValidKey) {
    logger.warn('Claude API key not configured, using mock response');
    return {
      response: getMockResponseMessage('claude', config),
      tokensIn: 0,
      tokensOut: 0,
      model: config.defaultModel,
    };
  }

  try {
    const response: AiServiceResponse = await callClaudeAPI(messages);
    
    logger.info('CLAUDE response received', {
      tokensIn: response.tokensIn,
      tokensOut: response.tokensOut,
      model: response.model,
    });
    
    return response;
    
  } catch (error: any) {
    logger.error('CLAUDE API error:', error);
    
    if (error.message.includes('invalid_api_key')) {
      throw new AppError(getInvalidKeyMessage('claude', config.keyEnv), 401);
    }
    if (error.message.includes('rate_limit')) {
      throw new AppError(getRateLimitMessage(), 429);
    }
    
    throw new AppError(`Failed to get AI response from Claude: ${error.message}`, 500);
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