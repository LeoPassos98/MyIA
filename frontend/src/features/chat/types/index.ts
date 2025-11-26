export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  
  // Metadados opcionais para debug e custos
  model?: string;
  provider?: string;
  costInUSD?: number;
  tokensIn?: number;
  tokensOut?: number;
  sentContext?: any;
}

export interface ChatConfig {
  provider: string;
  model: string; // <--- ADICIONADO (Resolve o erro)
  temperature: number;
  topK: number;
  memoryWindow: number;
  maxTokens?: number;
  // Tipagem estrita para evitar erros de digitação
  strategy: 'fast' | 'efficient' | 'thorough' | 'creative';
}

export interface ManualContextState {
  isActive: boolean; // Mantido para compatibilidade
  selectedMessageIds: string[];
  additionalText: string;
  hasAdditionalContext: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

// Payloads de API (Útil para os serviços)
export interface SendMessagePayload {
  message: string;
  chatId?: string;
  config?: ChatConfig;
  manualContext?: {
    messageIds: string[];
    systemPrompt: string;
  };
}

export interface ChatResponse {
  message: Message;
  chatId: string;
  usage?: {
    totalTokens: number;
    cost: number;
  };
}

export interface Provider {
  value: string;
  label: string;
}