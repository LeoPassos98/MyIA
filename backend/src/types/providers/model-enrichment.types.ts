// backend/src/types/providers/model-enrichment.types.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Tipos para enriquecimento de modelos AWS
 */

export interface AWSModel {
  modelId: string;
  modelName: string;
  providerName: string;
  inputModalities: string[];
  outputModalities: string[];
  responseStreamingSupported: boolean;
}

export interface EnrichedModel {
  id: string;
  apiModelId: string;
  name: string;
  providerName: string;
  vendor?: string;
  description?: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  contextWindow: number;
  inputModalities: string[];
  outputModalities: string[];
  responseStreamingSupported: boolean;
  capabilities?: {
    maxContextWindow?: number;
    maxOutputTokens?: number;
    vision?: boolean;
    functionCalling?: boolean;
  };
  isInDatabase: boolean;
  isInRegistry: boolean;
}

export interface DBModel {
  apiModelId: string;
  name: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  contextWindow: number;
}

export interface Provider {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  models: Model[];
}

export interface Model {
  id: string;
  name: string;
  apiModelId: string;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  isActive: boolean;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlatModel {
  id: string;
  name: string;
  apiModelId: string;
  provider: string;
  providerName: string;
  contextWindow: number;
}

export interface ModelWithRating extends FlatModel {
  isAvailable: boolean;
  capabilities: string[];
  rating?: number;
  badge?: string;
  metrics?: Record<string, unknown>;
  scores?: Record<string, unknown>;
  ratingUpdatedAt?: string;
}
