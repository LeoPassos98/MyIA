// backend/src/types/capabilities.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Model Capabilities Type Definitions
 *
 * Define as capacidades e configurações suportadas por cada modelo de IA.
 * Usado para habilitar/desabilitar controles dinamicamente no frontend.
 */

export interface CapabilityRange {
  enabled: boolean;
  min?: number;
  max?: number;
  default?: number;
}

export interface ModelCapabilities {
  /**
   * Controle de temperatura (aleatoriedade das respostas)
   */
  temperature: {
    enabled: boolean;
    min: number;
    max: number;
    default: number;
  };

  /**
   * Top-K sampling (limita tokens candidatos por probabilidade rank)
   * Nota: Anthropic não suporta este parâmetro
   */
  topK: {
    enabled: boolean;
    min?: number;
    max?: number;
    default?: number;
  };

  /**
   * Top-P sampling (nucleus sampling - limita por probabilidade cumulativa)
   */
  topP: {
    enabled: boolean;
    min: number;
    max: number;
    default: number;
  };

  /**
   * Número máximo de tokens na resposta
   */
  maxTokens: {
    enabled: boolean;
    min: number;
    max: number;
    default: number;
  };

  /**
   * Sequências de parada customizadas
   */
  stopSequences: {
    enabled: boolean;
    max?: number;
  };

  /**
   * Suporte a streaming de respostas
   */
  streaming: {
    enabled: boolean;
  };

  /**
   * Suporte a análise de imagens (vision)
   */
  vision: {
    enabled: boolean;
  };

  /**
   * Suporte a function calling / tool use
   */
  functionCalling: {
    enabled: boolean;
  };

  /**
   * Suporte a system prompt customizado
   */
  systemPrompt: {
    enabled: boolean;
  };

  /**
   * Tamanho máximo da janela de contexto (tokens de entrada)
   */
  maxContextWindow: number;

  /**
   * Número máximo de tokens de saída suportados
   */
  maxOutputTokens: number;

  /**
   * Indica se o modelo requer inference profile (AWS Bedrock)
   */
  requiresInferenceProfile: boolean;
}

/**
 * Tipo para cache de capabilities
 */
export interface CachedCapabilities {
  capabilities: ModelCapabilities;
  timestamp: number;
}
