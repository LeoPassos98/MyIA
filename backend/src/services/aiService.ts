import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

// Configurações de providers OpenAI-compatíveis
const PROVIDERS = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    keyEnv: 'OPENAI_API_KEY',
    defaultModel: 'gpt-3.5-turbo',
  },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    defaultModel: 'llama-3.1-8b-instant',
  },
  together: {
    baseURL: 'https://api.together.xyz/v1',
    keyEnv: 'TOGETHER_API_KEY',
    defaultModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  },
  perplexity: {
    baseURL: 'https://api.perplexity.ai',
    keyEnv: 'PERPLEXITY_API_KEY',
    defaultModel: 'llama-3.1-sonar-small-128k-online',
  },
  mistral: {
    baseURL: 'https://api.mistral.ai/v1',
    keyEnv: 'MISTRAL_API_KEY',
    defaultModel: 'mistral-small-latest',
  },
};

type ProviderName = keyof typeof PROVIDERS;

const API_PROVIDER = (process.env.API_PROVIDER || 'groq') as ProviderName;

// Obter configuração do provider
function getProviderConfig(provider: ProviderName = API_PROVIDER) {
  const config = PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  const apiKey = process.env[config.keyEnv];
  const isValidKey = apiKey && !apiKey.includes('sua-chave');
  
  return { ...config, apiKey, isValidKey };
}

// Criar cliente para um provider específico
function createClient(provider: ProviderName = API_PROVIDER): OpenAI | null {
  const config = getProviderConfig(provider);
  
  if (!config.isValidKey) {
    return null;
  }
  
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const aiService = {
  async chat(messages: ChatMessage[], provider: ProviderName = API_PROVIDER): Promise<string> {
    const client = createClient(provider);
    const config = getProviderConfig(provider);
    
    if (!client) {
      logger.warn(`${provider} API key not configured, using mock response`);
      return `🤖 Esta é uma resposta mock. Configure a chave da API ${provider.toUpperCase()} no arquivo .env para usar IA real.\n\n` +
             `💡 Variável necessária: ${config.keyEnv}\n` +
             `💡 Dica: Groq e Together.ai são gratuitos!`;
    }

    try {
      const model = process.env[`${provider.toUpperCase()}_MODEL`] || config.defaultModel;
      
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

      // Tratamento específico para erro de quota
      if (error.status === 429 || error.code === 'insufficient_quota') {
        return `⚠️ A cota da API ${provider.toUpperCase()} foi excedida.\n\n` +
               `💡 Solução: Use uma API gratuita!\n` +
               `• Groq: https://console.groq.com (100% gratuito)\n` +
               `• Together.ai: https://together.ai ($25 de crédito grátis)\n` +
               `• Perplexity: https://docs.perplexity.ai ($5 de crédito grátis)`;
      }

      // Tratamento para erro de autenticação
      if (error.status === 401) {
        return `🔑 A chave da API ${provider.toUpperCase()} está inválida ou expirada.\n\n` +
               `Verifique sua chave e a variável de ambiente: ${config.keyEnv}`;
      }

      // Tratamento para rate limit
      if (error.code === 'rate_limit_exceeded') {
        return '⏱️ Muitas requisições em pouco tempo. Aguarde alguns segundos e tente novamente.';
      }

      // Erro genérico
      throw new AppError(`Failed to get AI response from ${provider}`, 500);
    }
  },

  // Listar providers configurados
  getConfiguredProviders(): Array<{ name: string; configured: boolean; model: string }> {
    return Object.entries(PROVIDERS).map(([name, config]) => {
      const apiKey = process.env[config.keyEnv];
      const isConfigured = !!apiKey && !apiKey.includes('sua-chave');
      
      return {
        name,
        configured: isConfigured,
        model: process.env[`${name.toUpperCase()}_MODEL`] || config.defaultModel,
      };
    });
  },

  // Testar conexão com um provider (health check)
  async testProvider(provider: ProviderName): Promise<{ success: boolean; message: string; responseTime?: number }> {
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
      
      // Testar endpoint gratuito (listagem de modelos)
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
  },
};