// frontend/src/features/promptTrace/types/promptTrace.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Informações do modelo usado na inferência
 */
export interface PromptTraceModelInfo {
  provider: string;
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

/**
 * Uso de recursos em um step
 */
export interface PromptTraceUsage {
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  costInUSD?: number;
  latencyMs?: number;
}

/**
 * Origem de um step no contexto
 */
export type StepOrigin = 'pinned' | 'rag' | 'recent' | 'rag+recent' | 'manual' | 'system' | 'user-input';

/**
 * Representa um passo/turno individual no trace
 */
export interface PromptTraceStep {
  stepId: string;
  stepNumber: number;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
  isPinned?: boolean;
  origin?: StepOrigin; // De onde veio essa mensagem no contexto
  wasTruncatedForEmbedding?: boolean; // Se o embedding foi gerado de versão truncada
  usage?: PromptTraceUsage;
  modelInfo?: PromptTraceModelInfo;
  metadata?: Record<string, unknown>;
}

/**
 * Registro completo de um Prompt Trace
 */
export interface PromptTraceRecord {
  traceId: string;
  messageId: string;
  chatId: string;
  userId?: string;
  timestamp: string;
  status: 'success' | 'error' | 'timeout' | 'pending';
  
  /** Mensagem de erro se status === 'error' */
  errorMessage?: string;

  /** Informações do modelo final */
  modelInfo: PromptTraceModelInfo;

  /** Lista de steps/turnos */
  steps: PromptTraceStep[];

  /** Uso total agregado */
  totalUsage: PromptTraceUsage;

  /** Metadados adicionais */
  metadata?: {
    strategy?: string;
    ragEnabled?: boolean;
    contextWindowSize?: number;
    pinnedMessagesCount?: number;
    rawConfig?: unknown;
  };

  /** Payload original do backend (fonte técnica / fiel) */
  rawPayload?: unknown;
}
