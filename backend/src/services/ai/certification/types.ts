// backend/src/services/ai/certification/types.ts
// Standards: docs/STANDARDS.md

export enum ModelCertificationStatus {
  UNTESTED = 'untested',
  TESTING = 'testing',
  CERTIFIED = 'certified',
  FAILED = 'failed',
  DEPRECATED = 'deprecated',
  MONITORING = 'monitoring'
}

export interface TestResult {
  testId: string;
  testName: string;
  passed: boolean;
  error?: string;
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
  results: TestResult[];
}
