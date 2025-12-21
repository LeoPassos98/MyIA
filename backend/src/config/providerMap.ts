// backend/src/config/providerMap.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

export interface ProviderInfo {
  costIn: number;       // Custo por 1M tokens de entrada
  costOut: number;      // Custo por 1M tokens de saída
  contextLimit: number; // Limite de tokens de contexto (input)
}

export const PROVIDER_MAP: Record<string, ProviderInfo> = {
  // --- Groq (Limite REAL descoberto: 6000, não 8000!) ---
  'llama-3.1-8b-instant': {
    costIn: 0.0,
    costOut: 0.0,
    contextLimit: 6000, // Corrigido após erro 413
  },
  'llama3-groq-70b-8192-tool-use-preview': {
    costIn: 0.0,
    costOut: 0.0,
    contextLimit: 6000,
  },

  // --- OpenAI ---
  'gpt-4o': {
    costIn: 5.0,
    costOut: 15.0,
    contextLimit: 128000,
  },
  'gpt-4o-mini': {
    costIn: 0.15,
    costOut: 0.6,
    contextLimit: 128000,
  },
  'gpt-3.5-turbo': {
    costIn: 0.5,
    costOut: 1.5,
    contextLimit: 16000,
  },

  // --- Claude (Anthropic) ---
  'claude-3-5-sonnet-20241022': {
    costIn: 3.0,
    costOut: 15.0,
    contextLimit: 200000,
  },
  'claude-3-5-sonnet-20240620': {
    costIn: 3.0,
    costOut: 15.0,
    contextLimit: 200000,
  },
  'claude-3-opus-20240229': {
    costIn: 15.0,
    costOut: 75.0,
    contextLimit: 200000,
  },

  // --- Together.ai ---
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo': {
    costIn: 0.18,
    costOut: 0.18,
    contextLimit: 131072,
  },
  'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': {
    costIn: 0.88,
    costOut: 0.88,
    contextLimit: 131072,
  },

  // --- Perplexity ---
  'llama-3.1-sonar-small-128k-online': {
    costIn: 0.2,
    costOut: 0.2,
    contextLimit: 127000,
  },
  'llama-3.1-sonar-large-128k-online': {
    costIn: 1.0,
    costOut: 1.0,
    contextLimit: 127000,
  },

  // --- Mistral ---
  'mistral-small-latest': {
    costIn: 0.2,
    costOut: 0.6,
    contextLimit: 32000,
  },
  'mistral-large-latest': {
    costIn: 2.0,
    costOut: 6.0,
    contextLimit: 128000,
  },

  // --- Modelos de Embedding (V9.2) ---
  'text-embedding-3-small': {
    costIn: 0.02,  // $0.02 por 1M tokens (só entrada)
    costOut: 0.0,
    contextLimit: 8191 // Limite de tokens do modelo
  },
  'text-embedding-3-large': {
    costIn: 0.13,  // $0.13 por 1M tokens
    costOut: 0.0,
    contextLimit: 8191
  },
  'text-embedding-ada-002': {
    costIn: 0.10,  // $0.10 por 1M tokens
    costOut: 0.0,
    contextLimit: 8191
  }
};

// Fallback seguro para modelos não mapeados
export const DEFAULT_PROVIDER_INFO: ProviderInfo = {
  costIn: 0.0,
  costOut: 0.0,
  contextLimit: 4000, // Muito conservador
};

// Helper para pegar informações do provider
export function getProviderInfo(modelName: string): ProviderInfo {
  return PROVIDER_MAP[modelName] || DEFAULT_PROVIDER_INFO;
}
