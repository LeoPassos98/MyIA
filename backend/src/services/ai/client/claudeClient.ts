import axios from 'axios';
import { ChatMessage, AiServiceResponse } from '../types';
import { getProviderConfig } from '../utils/providerUtils';

export async function callClaudeAPI(
  messages: ChatMessage[]
): Promise<AiServiceResponse> {
  const config = getProviderConfig('claude');
  
  if (!config.isValidKey || !config.apiKey) {
    throw new Error('Claude API key not configured');
  }

  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const claudeMessages = conversationMessages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content,
  }));

  try {
    const response = await axios.post(
      `${config.baseURL}/messages`,
      {
        model: process.env.ANTHROPIC_MODEL || config.defaultModel,
        max_tokens: 1024,
        messages: claudeMessages,
        ...(systemMessage && { system: systemMessage }),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    const responseData = response.data;
    const textResponse = responseData.content[0].text;
    const usage = responseData.usage;
    const modelUsed = responseData.model;

    const standardizedResponse: AiServiceResponse = {
      response: textResponse,
      tokensIn: usage.input_tokens || 0,
      tokensOut: usage.output_tokens || 0,
      model: modelUsed,
    };

    return standardizedResponse;

  } catch (error: any) {
    if (error.response) {
      throw new Error(`Claude API error: ${error.response.data.error?.message || error.message}`);
    }
    throw error;
  }
}