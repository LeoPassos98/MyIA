// backend/src/controllers/certificationQueue/transformers/responseTransformer.ts
// Standards: docs/STANDARDS.md

import { ModelCertification, CertificationJob } from '@prisma/client';
import { statusTransformer } from './statusTransformer';
import { logger } from '../../../utils/logger';

/**
 * Certificação transformada para resposta
 */
export interface TransformedCertification {
  id: string;
  modelId: string;
  region: string;
  status: string;
  rating: number | null;
  avgLatencyMs: number | null;
  errorMessage: string | null;
  errorCategory: string | null;
  testsPassed: number;
  testsFailed: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Job transformado para resposta
 */
export interface TransformedJobStatus {
  jobId: string;
  bullJobId?: string;
  type: string;
  status: string;
  totalModels: number;
  processedModels: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

/**
 * Estatísticas transformadas para resposta
 */
export interface TransformedStats {
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  certificationsByRegion: Array<{
    region: string;
    status: string;
    count: number;
  }>;
  certificationsByStatus: Array<{
    status: string;
    count: number;
  }>;
  recentCertifications: TransformedCertification[];
}

/**
 * Transformador de respostas de certificação
 * 
 * Responsabilidades:
 * - Transformar entidades Prisma para formato de resposta
 * - Aplicar conversões de status (UPPERCASE → lowercase)
 * - Formatar dados para consumo do frontend
 * - Garantir consistência de formato em todas as respostas
 */
export class ResponseTransformer {
  /**
   * Transforma certificação do Prisma para formato de resposta
   * 
   * @param cert - Certificação do Prisma
   * @returns Certificação transformada
   */
  transformCertification(cert: ModelCertification): TransformedCertification {
    logger.debug('[ResponseTransformer] Transformando certificação', {
      certId: cert.id,
      modelId: cert.modelId,
      status: cert.status
    });

    return {
      id: cert.id,
      modelId: cert.modelId,
      region: cert.region,
      status: statusTransformer.toFrontendStatus(cert.status),
      rating: cert.rating,
      avgLatencyMs: cert.avgLatencyMs,
      errorMessage: cert.errorMessage,
      errorCategory: cert.errorCategory,
      testsPassed: cert.testsPassed,
      testsFailed: cert.testsFailed,
      successRate: cert.successRate,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt
    };
  }

  /**
   * Transforma array de certificações
   * 
   * @param certs - Array de certificações do Prisma
   * @returns Array de certificações transformadas
   */
  transformCertifications(certs: ModelCertification[]): TransformedCertification[] {
    logger.debug('[ResponseTransformer] Transformando múltiplas certificações', {
      count: certs.length
    });

    return certs.map(cert => this.transformCertification(cert));
  }

  /**
   * Transforma job do Prisma para formato de resposta
   * 
   * @param job - Job do Prisma
   * @returns Job transformado
   */
  transformJobStatus(job: CertificationJob): TransformedJobStatus {
    logger.debug('[ResponseTransformer] Transformando job status', {
      jobId: job.id,
      type: job.type,
      status: job.status
    });

    return {
      jobId: job.id,
      bullJobId: job.bullJobId || undefined,
      type: job.type,
      status: job.status,
      totalModels: job.totalModels,
      processedModels: job.processedModels,
      successCount: job.successCount,
      failureCount: job.failureCount,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    };
  }

  /**
   * Transforma estatísticas para formato de resposta
   * 
   * @param stats - Estatísticas brutas
   * @returns Estatísticas transformadas
   */
  transformStats(stats: {
    queue: any;
    certificationsByRegion: Array<{ region: string; status: any; _count: number }>;
    certificationsByStatus: Array<{ status: any; _count: number }>;
    recentCertifications: ModelCertification[];
  }): TransformedStats {
    logger.debug('[ResponseTransformer] Transformando estatísticas');

    return {
      queue: stats.queue,
      certificationsByRegion: stats.certificationsByRegion.map(item => ({
        region: item.region,
        status: statusTransformer.toFrontendStatus(item.status),
        count: item._count
      })),
      certificationsByStatus: stats.certificationsByStatus.map(item => ({
        status: statusTransformer.toFrontendStatus(item.status),
        count: item._count
      })),
      recentCertifications: this.transformCertifications(stats.recentCertifications)
    };
  }

  /**
   * Transforma resposta de criação de job
   * 
   * @param result - Resultado da criação do job
   * @returns Resposta transformada
   */
  transformJobCreationResponse(result: {
    jobId: string;
    bullJobId?: string;
    totalJobs?: number;
  }): {
    jobId: string;
    bullJobId?: string;
    totalJobs?: number;
    status: string;
  } {
    return {
      ...result,
      status: 'QUEUED'
    };
  }

  /**
   * Transforma resposta de paginação
   * 
   * @param items - Items a serem paginados
   * @param page - Página atual
   * @param limit - Limite por página
   * @param total - Total de items
   * @returns Resposta paginada
   */
  transformPaginatedResponse<T>(
    items: T[],
    page: number,
    limit: number,
    total: number
  ): {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } {
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

// Exportar instância singleton
export const responseTransformer = new ResponseTransformer();
