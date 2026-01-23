// frontend/src/features/chat/types/index.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  isPinned?: boolean;
  
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
  model: string;
  vendorSlug?: string;  // NOVO - Rastrear vendor do modelo (opcional para compatibilidade)
  temperature: number;
  topK?: number;        // Tornar opcional (alguns modelos não suportam)
  topP?: number;        // ADICIONAR - Nucleus sampling
  maxTokens?: number;   // Já existe, manter
  memoryWindow: number;
  // Tipagem estrita para evitar erros de digitação
  strategy: 'fast' | 'efficient' | 'thorough' | 'creative';
  isAutoMode?: boolean; // ✅ NOVO - Modo Auto/Manual de parâmetros
}

export interface ManualContextState {
  isActive: boolean; // Mantido para compatibilidade
  selectedMessageIds: string[];
  additionalText: string;
  hasAdditionalContext: boolean;
}

/**
 * Configuração do Pipeline de Contexto
 * Define como o contexto é construído e enviado para a IA
 */
export interface ContextPipelineConfig {
  // System Prompt
  systemPrompt: string;
  useCustomSystemPrompt: boolean;

  // Mensagens Pinadas (sempre incluídas se enabled)
  pinnedEnabled: boolean;

  // Mensagens Recentes
  recentEnabled: boolean;
  recentCount: number; // Quantas mensagens recentes incluir (padrão: 10)

  // RAG (Busca Semântica)
  ragEnabled: boolean;
  ragTopK: number; // Quantas mensagens similares buscar (padrão: 5)

  // Limite de Tokens
  maxContextTokens: number; // Budget máximo (padrão: 6000)
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