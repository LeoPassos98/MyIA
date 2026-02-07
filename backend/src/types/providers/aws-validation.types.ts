// backend/src/types/providers/aws-validation.types.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Tipos para validação de credenciais AWS Bedrock
 */

export interface BedrockConfig {
  accessKey?: string;
  secretKey?: string;
  region: string;
  useStoredCredentials?: boolean;
}

export interface AWSCredentials {
  accessKey: string;
  secretKey: string;
  region: string;
}

export interface ValidationResult {
  status: 'valid' | 'invalid';
  message: string;
  latencyMs: number;
  modelsCount: number;
  error?: string;
}

export interface ValidationRecord {
  userId: string;
  provider: string;
  status: 'valid' | 'invalid';
  lastValidatedAt: Date;
  latencyMs?: number;
  lastError?: string | null;
  errorCode?: string | null;
}
