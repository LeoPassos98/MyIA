// backend/src/types/vendors.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

export interface VendorGroup {
  id: string;
  name: string;
  slug: string;
  logo: string;
  models: ModelWithProviders[];
}

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

export interface ProviderAvailability {
  providerSlug: string;
  providerName: string;
  isConfigured: boolean;
  certification: CertificationInfo | null;
}

export interface CertificationInfo {
  status: string;
  successRate?: number;
  lastChecked?: string;
}
