// frontend/src/types/ai.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Categorias de erro para certificação de modelos
 */
export type ErrorCategory = 
  | 'UNAVAILABLE'
  | 'PERMISSION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'CONFIGURATION_ERROR'
  | 'QUALITY_ISSUE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Severidade do erro
 */
export type ErrorSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Status de certificação do modelo
 */
export type CertificationStatus = 
  | 'certified'
  | 'failed'
  | 'quality_warning'
  | 'configuration_required'
  | 'permission_required';

/**
 * Erro categorizado com ações sugeridas
 */
export interface CategorizedError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  originalError: string;
  suggestedActions: string[];
  isTemporary: boolean;
}

/**
 * Detalhes de certificação de um modelo
 */
export interface CertificationDetails {
  modelId: string;
  status?: CertificationStatus;
  errorCategory?: ErrorCategory;
  errorSeverity?: ErrorSeverity;
  isAvailable?: boolean;
  categorizedError?: CategorizedError;
  lastChecked?: string;
  error?: string;
}

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

/**
 * Resposta do endpoint /api/providers/by-vendor
 */
export interface ModelsByVendor {
  vendors: VendorGroup[];
}

/**
 * Grupo de modelos por vendor (empresa/criador)
 */
export interface VendorGroup {
  id: string;
  name: string;
  slug: string;
  logo: string;
  models: ModelWithProviders[];
}

/**
 * Modelo com informações de disponibilidade em múltiplos providers
 */
export interface ModelWithProviders {
  id: string;
  name: string;
  apiModelId: string;
  contextWindow: number;
  maxOutputTokens?: number;
  version?: string;
  availableOn: ProviderAvailability[];
  capabilities?: {
    supportsVision?: boolean;
    supportsPromptCache?: boolean;
    supportsFunctionCalling?: boolean;
  };
  pricing?: {
    inputPer1M?: number;
    outputPer1M?: number;
    cacheReadPer1M?: number;
    cacheWritePer1M?: number;
  };
}

/**
 * Disponibilidade de um modelo em um provider específico
 */
export interface ProviderAvailability {
  providerSlug: string;
  providerName: string;
  isConfigured: boolean;
  certification: CertificationInfo | null;
}

/**
 * Informações de certificação de um modelo
 */
export interface CertificationInfo {
  status: string;
  successRate?: number;
  lastChecked?: string;
}

/**
 * Regiões AWS suportadas para certificação
 */
export type AWSRegion = 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'ap-southeast-1';

/**
 * Mapeamento de regiões AWS para nomes amigáveis
 */
export const AWS_REGION_NAMES: Record<AWSRegion, string> = {
  'us-east-1': 'US East (N. Virginia)',
  'us-west-2': 'US West (Oregon)',
  'eu-west-1': 'EU West (Ireland)',
  'ap-southeast-1': 'Asia Pacific (Singapore)'
};

/**
 * Lista de todas as regiões AWS suportadas
 */
export const AWS_REGIONS: AWSRegion[] = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

/**
 * Certificação regional de um modelo
 */
export interface RegionalCertification {
  region: AWSRegion;
  status: CertificationStatus | 'not_tested';
  lastTestedAt?: string;
  attempts?: number;
  error?: string;
  errorCategory?: ErrorCategory;
  successRate?: number;
}
