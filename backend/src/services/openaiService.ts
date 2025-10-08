import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

// Verificar se a chave é válida (não é placeholder)
const isValidKey = OPENAI_API_KEY && !OPENAI_API_KEY.includes('sua-chave');

const openai = isValidKey ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const openaiService = {
  async chat(messages: ChatMessage[]): Promise<string> {
    if (!openai) {
      logger.warn('OpenAI API key not configured, using mock response');
      return 'Esta é uma resposta mock. Configure a chave da OpenAI no arquivo .env para usar a API real.';
    }

    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new AppError('No response from OpenAI', 500);
      }

      logger.info('OpenAI response received', { 
        tokens: response.usage?.total_tokens 
      });

      return content;
    } catch (error: any) {
      logger.error('OpenAI API error:', error);
      throw new AppError('Failed to get AI response', 500);
    }
  },
};