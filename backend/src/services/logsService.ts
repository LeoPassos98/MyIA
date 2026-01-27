// backend/src/services/logsService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Interface para filtros de busca de logs
 */
export interface LogFilters {
  level?: string;
  userId?: string;
  requestId?: string;
  inferenceId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Interface para opções de paginação e ordenação
 */
export interface LogQueryOptions {
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
}

/**
 * Interface para resultado paginado
 */
export interface PaginatedLogs {
  logs: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Service para operações de busca e consulta de logs
 */
export const logsService = {
  /**
   * Busca logs com filtros, paginação e ordenação
   * 
   * @param filters - Filtros de busca (level, userId, requestId, etc.)
   * @param options - Opções de paginação e ordenação
   * @returns Logs paginados com metadata
   */
  async searchLogs(
    filters: LogFilters,
    options: LogQueryOptions
  ): Promise<PaginatedLogs> {
    // Valores padrão para paginação
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100); // Máximo 100 itens
    const sort = options.sort || 'desc';
    const skip = (page - 1) * limit;

    // Construir objeto where do Prisma
    const where: Prisma.LogWhereInput = {};

    // Filtro por nível
    if (filters.level) {
      where.level = filters.level;
    }

    // Filtro por userId
    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Filtro por requestId
    if (filters.requestId) {
      where.requestId = filters.requestId;
    }

    // Filtro por inferenceId
    if (filters.inferenceId) {
      where.inferenceId = filters.inferenceId;
    }

    // Filtro por range de datas
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    // Busca em message (case-insensitive)
    if (filters.search) {
      where.message = {
        contains: filters.search,
        mode: 'insensitive'
      };
    }

    // Executar query com contagem total (paralelo para performance)
    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          timestamp: sort
        }
      }),
      prisma.log.count({ where })
    ]);

    // Calcular total de páginas
    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  },

  /**
   * Busca um log específico por ID
   * 
   * @param id - ID do log
   * @returns Log encontrado ou null
   */
  async getLogById(id: string) {
    return prisma.log.findUnique({
      where: { id }
    });
  },

  /**
   * Busca logs por requestId (correlação de logs)
   * 
   * @param requestId - ID da requisição
   * @returns Array de logs relacionados
   */
  async getLogsByRequestId(requestId: string) {
    return prisma.log.findMany({
      where: { requestId },
      orderBy: { timestamp: 'asc' }
    });
  },

  /**
   * Busca logs por userId com paginação
   * 
   * @param userId - ID do usuário
   * @param options - Opções de paginação
   * @returns Logs paginados do usuário
   */
  async getLogsByUserId(userId: string, options: LogQueryOptions) {
    return this.searchLogs({ userId }, options);
  },

  /**
   * Busca logs de erro recentes
   * 
   * @param limit - Número de logs a retornar (padrão: 50)
   * @returns Array de logs de erro
   */
  async getRecentErrors(limit: number = 50) {
    return prisma.log.findMany({
      where: { level: 'error' },
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 100)
    });
  },

  /**
   * Estatísticas de logs por nível
   * 
   * @param startDate - Data início (opcional)
   * @param endDate - Data fim (opcional)
   * @returns Contagem de logs por nível
   */
  async getLogStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.LogWhereInput = {};

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const stats = await prisma.log.groupBy({
      by: ['level'],
      where,
      _count: {
        level: true
      }
    });

    return stats.map(stat => ({
      level: stat.level,
      count: stat._count.level
    }));
  },

  /**
   * Busca logs com metadata específica (JSONB query)
   * 
   * @param metadataQuery - Query JSONB (ex: { provider: 'groq' })
   * @param options - Opções de paginação
   * @returns Logs paginados
   */
  async searchByMetadata(
    metadataQuery: Record<string, any>,
    options: LogQueryOptions
  ): Promise<PaginatedLogs> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const sort = options.sort || 'desc';
    const skip = (page - 1) * limit;

    // Query JSONB usando path do Prisma
    const where: Prisma.LogWhereInput = {
      metadata: {
        path: Object.keys(metadataQuery),
        equals: Object.values(metadataQuery)[0]
      }
    };

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: sort }
      }),
      prisma.log.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }
};
