// backend/src/audit/domain/AuditTypes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

export interface InferenceStrategy {
  name: string;              // ex: "default", "creative", "rag-assisted"
  version?: string;
  description?: string;
}

export interface InferenceParameters {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface PromptAudit {
  prompt: string;

  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;

  extraContext?: string;
  rawPayload?: unknown;
}

export interface ResponseAudit {
  outputText?: string;
  rawResponse?: unknown;
  finishReason?: string;
}

export interface UsageAudit {
  tokensIn?: number;
  tokensOut?: number;
  totalTokens?: number;
  costInUSD?: number;
  latencyMs?: number;
}

export interface ErrorAudit {
  errorCode?: string;
  errorMessage?: string;
  providerError?: unknown;
  category?: string;
}

export interface RagAudit {
  documents?: Array<{
    id: string;
    score?: number;
    source?: string;
  }>;
  vectorSearchUsed?: boolean;
}

export interface PolicyAudit {
  decision?: 'allowed' | 'blocked' | 'modified';
  reason?: string;
  appliedRules?: string[];
}
