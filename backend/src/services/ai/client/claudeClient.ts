import axios from 'axios';
import { ChatMessage } from '../types';
import { getProviderConfig } from '../utils/providerUtils';

export async function callClaudeAPI(messages: ChatMessage[]): Promise<string> {
  const config = getProviderConfig('claude');
  
  if (!config.isValidKey || !config.apiKey) {
    throw new Error('Claude API key not configured');
  }

  // Separar system message das outras mensagens
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter(m => m.role !== 'system');

  // Converter formato OpenAI para formato Claude
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

    return response.data.content[0].text;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Claude API error: ${error.response.data.error?.message || error.message}`);
    }
    throw error;
  }
}