// backend/src/types/certification-queue.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

export interface CertificationJobData {
  jobId: string;
  modelId: string;
  region: string;
  createdBy?: string;
}

export interface BatchCertificationJobData {
  jobId: string;
  type: 'SINGLE_MODEL' | 'MULTIPLE_MODELS' | 'ALL_MODELS' | 'RECERTIFY';
  regions: string[];
  modelIds: string[];
  createdBy?: string;
}

export interface CertificationResult {
  modelId: string;
  region: string;
  passed: boolean;
  score?: number;
  rating?: number | null;  // Float 0-5.0 (compatível com Prisma)
  badge?: string;          // CERTIFIED, FAILED, QUALITY_WARNING, etc
  testResults?: any;
  errorMessage?: string;
  errorCategory?: string;
  duration: number;
}

export interface CertificationJobStatus {
  id: string;
  type: string;
  status: string;
  regions: string[];
  modelIds: string[];
  totalModels: number;
  processedModels: number;
  successCount: number;
  failureCount: number;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  certifications: any[];
}
