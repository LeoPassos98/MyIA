// Reexportar ou copiar a interface Message de chatHistoryService
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  costInUSD?: number;
  model?: string;
  provider?: string;
  tokensIn?: number;
  tokensOut?: number;
  sentContext?: any;
}

// Definir e exportar a interface ChatConfig
export interface ChatConfig {
  provider: string;
  strategy: string;
  temperature: number;
  topK: number;
  memoryWindow: number;
}

// Definir e exportar a interface ManualContextState
export interface ManualContextState {
  isActive: boolean;
  selectedMessageIds: string[];
  additionalText: string;
}
