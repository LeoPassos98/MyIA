// backend/src/services/ai/certification/types.ts
// Standards: docs/STANDARDS.md

/**
 * Evento de progresso para SSE (Server-Sent Events)
 * Usado para enviar feedback em tempo real durante a certificação
 */
export interface ProgressEvent {
  type: 'progress' | 'complete' | 'error';
  current?: number;
  total?: number;
  testName?: string;
  status?: 'running' | 'passed' | 'failed';
  message?: string;
  certification?: CertificationResult;
}

/**
 * Callback de progresso para certificação
 * Função chamada durante a execução dos testes para enviar atualizações via SSE
 */
export type ProgressCallback = (event: ProgressEvent) => void;

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
  PROVISIONING_REQUIRED = 'PROVISIONING_REQUIRED',  // Novo: modelo requer provisionamento
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
 * NOTA: Valores devem corresponder ao enum CertificationStatus do Prisma
 */
export enum ModelCertificationStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CERTIFIED = 'CERTIFIED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  QUALITY_WARNING = 'QUALITY_WARNING'
}

// Mapeamento de valores legados para novos status
export const LegacyStatusMapping = {
  UNTESTED: ModelCertificationStatus.PENDING,
  TESTING: ModelCertificationStatus.PROCESSING,
  DEPRECATED: ModelCertificationStatus.FAILED,
  MONITORING: ModelCertificationStatus.CERTIFIED
} as const;

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
  qualityIssues?: string[];           // Novo: lista de testes que falharam
  results: TestResult[];
  categorizedError?: CategorizedError; // Novo: erro categorizado se houver
  overallSeverity?: ErrorSeverity;    // Nova: severidade geral
}
