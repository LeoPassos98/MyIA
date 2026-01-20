/**
 * frontend/src/types/certification.ts
 * Type definitions for model certification system
 * Standards: docs/STANDARDS.md
 */

export enum ModelCertificationStatus {
  UNTESTED = 'untested',
  TESTING = 'testing',
  CERTIFIED = 'certified',
  FAILED = 'failed',
  DEPRECATED = 'deprecated',
  MONITORING = 'monitoring'
}

export interface ModelCertification {
  modelId: string;
  vendor: string;
  status: ModelCertificationStatus;
  certifiedAt?: Date;
  expiresAt?: Date;
  testsPassed: number;
  testsFailed: number;
  successRate: number;
  avgLatencyMs?: number;
  lastError?: string;
}
