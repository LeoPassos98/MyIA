export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ProviderConfig {
  baseURL: string;
  keyEnv: string;
  defaultModel: string;
}

export type ProviderName = 'openai' | 'groq' | 'together' | 'perplexity' | 'mistral' | 'claude';

export interface ProviderInfo {
  name: string;
  configured: boolean;
  model: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  responseTime?: number;
}

// O "recibo" padronizado que CADA provider deve retornar
export interface AiServiceResponse {
  response: string;      // O texto puro
  tokensIn: number;      // Tokens de prompt
  tokensOut: number;     // Tokens de conclusão
  model: string;         // O modelo exato usado (ex: 'gpt-4o')
}