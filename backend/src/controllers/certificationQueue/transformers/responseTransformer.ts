// backend/src/controllers/certificationQueue/transformers/responseTransformer.ts
// Standards: docs/STANDARDS.md

import { ModelCertification, CertificationStatus } from '@prisma/client';
import { logger } from '../../../utils/logger';
import { statusTransformer } from './statusTransformer';

/**
 * Certificação transformada para resposta
 * Schema v2: Usa deploymentId em vez de modelId
 */
export interface TransformedCertification {
  id: string;
  deploymentId: string;
  modelId?: string; // Compatibilidade com código antigo
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
      deploymentId: cert.deploymentId,
      status: cert.status
    });

    return {
      id: cert.id,
      deploymentId: cert.deploymentId,
      modelId: cert.deploymentId, // Compatibilidade com código antigo
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
   * Transforma job para formato de resposta
   * Schema v2: CertificationJob foi removido - aceita objeto genérico
   *
   * @param job - Dados do job (pode vir do Bull queue ou agregação)
   * @returns Job transformado
   */
  transformJobStatus(job: {
    id: string;
    bullJobId?: string | null;
    type?: string;
    status: string;
    totalModels: number;
    processedModels: number;
    successCount: number;
    failureCount: number;
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date | null;
    completedAt?: Date | null;
  }): TransformedJobStatus {
    logger.debug('[ResponseTransformer] Transformando job status', {
      jobId: job.id,
      type: job.type,
      status: job.status
    });

    return {
      jobId: job.id,
      bullJobId: job.bullJobId || undefined,
      type: job.type || 'CERTIFICATION',
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
    queue: TransformedStats['queue'];
    certificationsByRegion: Array<{ region: string; status: CertificationStatus; _count: number }>;
    certificationsByStatus: Array<{ status: CertificationStatus; _count: number }>;
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
