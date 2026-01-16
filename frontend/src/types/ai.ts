// frontend/src/types/ai.ts

/**
 * Modelo de IA básico (usado no ModelTab)
 */
export interface AIModel {
  id: string;
  name: string;       // Ex: "GPT-4 Turbo"
  apiModelId: string; // Ex: "gpt-4-turbo"
  contextWindow: number;
}

/**
 * Modelo de IA enriquecido com dados da AWS (usado no AWSProviderPanel)
 * Estende AIModel com informações adicionais da AWS e do banco de dados
 */
export interface EnrichedAWSModel extends AIModel {
  providerName?: string;         // Ex: "Anthropic" (da AWS API)
  costPer1kInput: number;        // Do banco de dados
  costPer1kOutput: number;       // Do banco de dados
  inputModalities?: string[];    // Da AWS API
  outputModalities?: string[];   // Da AWS API
  responseStreamingSupported?: boolean; // Da AWS API
  isInDatabase?: boolean;        // Se tem informações no banco
}

/**
 * Provedor de IA (usado no ModelTab)
 */
export interface AIProvider {
  id: string;
  name: string;       // Ex: "OpenAI"
  slug: string;       // Ex: "openai"
  isActive: boolean;
  logoUrl?: string;
  models: AIModel[];
}
