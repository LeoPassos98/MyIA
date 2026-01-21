// backend/src/services/ai/certification/types.ts
// Standards: docs/STANDARDS.md

/**
 * Categorias de erro na certificação
 */
export enum ErrorCategory {
  UNAVAILABLE = 'UNAVAILABLE',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Severidade do erro
 */
export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',    // 🔴 Modelo não pode ser usado
  HIGH = 'HIGH',            // 🟠 Requer ação mas pode ter workaround
  MEDIUM = 'MEDIUM',        // 🟡 Temporário ou recuperável
  LOW = 'LOW'               // 🟢 Modelo funciona mas com limitações
}

/**
 * Status de certificação expandido
 */
export enum ModelCertificationStatus {
  UNTESTED = 'untested',
  TESTING = 'testing',
  CERTIFIED = 'certified',
  FAILED = 'failed',
  QUALITY_WARNING = 'quality_warning',  // Novo: funciona mas com avisos
  DEPRECATED = 'deprecated',
  MONITORING = 'monitoring'
}

/**
 * Erro categorizado de certificação
 */
export interface CategorizedError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  originalError: string;
  suggestedActions: string[];
  isTemporary: boolean;
}

export interface TestResult {
  testId: string;
  testName: string;
  passed: boolean;
  error?: string;
  errorCategory?: ErrorCategory;  // Nova: categoria do erro
  latencyMs: number;
  metadata?: Record<string, any>;
}

export interface TestSpec {
  id: string;
  name: string;
  description: string;
  timeout: number;
  run(modelId: string, provider: any, apiKey: string): Promise<TestResult>;
}

export interface CertificationResult {
  modelId: string;
  status: ModelCertificationStatus;
  testsPassed: number;
  testsFailed: number;
  successRate: number;
  avgLatencyMs: number;
  isCertified: boolean;
  isAvailable?: boolean;              // Novo: TRUE se modelo pode ser usado
  results: TestResult[];
  categorizedError?: CategorizedError; // Novo: erro categorizado se houver
  overallSeverity?: ErrorSeverity;    // Nova: severidade geral
}
