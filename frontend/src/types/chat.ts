// Types for Chat Configuration (V47)

export interface ChatConfig {
  provider: string; // ex: 'openai', 'groq', 'claude', 'together', 'perplexity', 'mistral'
  model: string;    // ex: 'gpt-4', 'llama-3.1-8b-instant'
  strategy: 'fast' | 'efficient';
  temperature: number; // 0.0 a 1.0
  topK: number;        // 1 a 10 (RAG retrieval depth)
  memoryWindow: number;// 0 a 20 (History window)
}

export interface ManualContextState {
  isActive: boolean; // Se true, ignora RAG automático
  selectedMessageIds: string[]; // IDs para incluir no payload
  additionalText: string; // Contexto injetado manualmente
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  model?: string;
  provider?: string;
  tokensIn?: number;
  tokensOut?: number;
  costInUSD?: number;
  sentContext?: any;
}
