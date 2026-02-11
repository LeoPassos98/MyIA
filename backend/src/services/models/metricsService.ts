// backend/src/services/models/metricsService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Nomes de métricas pré-definidas do sistema
 * Use estas constantes para garantir consistência nos nomes das métricas
 */
export const METRIC_NAMES = {
  /** Latência de resposta em milissegundos */
  LATENCY: 'latency',
  /** Contagem de tokens (input + output) */
  TOKEN_COUNT: 'token_count',
  /** Tokens de entrada */
  INPUT_TOKENS: 'input_tokens',
  /** Tokens de saída */
  OUTPUT_TOKENS: 'output_tokens',
  /** Taxa de erro (0-1) */
  ERROR_RATE: 'error_rate',
  /** Custo em USD */
  COST: 'cost',
  /** Throughput (requests por segundo) */
  THROUGHPUT: 'throughput',
  /** Contagem de erros */
  ERROR_COUNT: 'error_count',
  /** Contagem de requisições */
  REQUEST_COUNT: 'request_count',
  /** Tempo de resposta do primeiro token (TTFT) */
  TIME_TO_FIRST_TOKEN: 'time_to_first_token'
} as const;

/**
 * Tipos de métricas do sistema
 */
export type MetricName = typeof METRIC_NAMES[keyof typeof METRIC_NAMES];

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Metadados adicionais para uma métrica
 */
export interface MetricMetadata {
  region?: string;
  provider?: string;
  errorType?: string;
  [key: string]: unknown;
}

/**
 * Dados para criação de uma métrica
 */
export interface CreateMetricData {
  metricType: string;
  value: number;
  deploymentId?: string;
  metadata?: MetricMetadata;
  timestamp?: Date;
}

/**
 * Intervalo de tempo para queries
 */
export interface TimeRange {
  startTime: Date;
  endTime: Date;
}

/**
 * Opções de query para métricas
 */
export interface MetricQueryOptions {
  limit?: number;
  orderBy?: 'timestamp' | 'value';
  order?: 'asc' | 'desc';
}

/**
 * Resultado de agregação
 */
export interface AggregationResult {
  value: number | null;
  count: number;
  metricType: string;
  timeRange?: TimeRange;
}

/**
 * Ponto de dados para tendência
 */
export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  count: number;
}

/**
 * Resultado de tendência
 */
export interface TrendResult {
  metricType: string;
  interval: string;
  dataPoints: TrendDataPoint[];
  timeRange: TimeRange;
}

/**
 * Comparação entre deployments
 */
export interface DeploymentComparison {
  deploymentId: string;
  average: number | null;
  min: number | null;
  max: number | null;
  count: number;
}

/**
 * Resultado de comparação de deployments
 */
export interface ComparisonResult {
  metricType: string;
  timeRange?: TimeRange;
  deployments: DeploymentComparison[];
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Service para gerenciar métricas de sistema e observabilidade
 * 
 * Responsabilidade única: Coletar, armazenar e analisar métricas de performance
 * e uso do sistema de modelos AI.
 */
export const metricsService = {
  // ==========================================================================
  // OPERAÇÕES CRUD
  // ==========================================================================

  /**
   * Cria uma nova métrica
   * 
   * @param data - Dados da métrica a ser criada
   * @returns Métrica criada
   * 
   * @example
   * ```typescript
   * const metric = await metricsService.create({
   *   metricType: METRIC_NAMES.LATENCY,
   *   value: 150,
   *   deploymentId: 'uuid-deployment',
   *   metadata: { region: 'us-east-1' }
   * });
   * ```
   */
  async create(data: CreateMetricData) {
    logger.debug('MetricsService.create', {
      metricType: data.metricType,
      deploymentId: data.deploymentId
    });

    const metric = await prisma.systemMetric.create({
      data: {
        metricType: data.metricType,
        value: data.value,
        deploymentId: data.deploymentId,
        metadata: data.metadata as Prisma.InputJsonValue,
        timestamp: data.timestamp || new Date()
      }
    });

    logger.info('MetricsService.create completed', {
      id: metric.id,
      metricType: metric.metricType
    });

    return metric;
  },

  /**
   * Cria múltiplas métricas em batch
   * 
   * @param dataArray - Array de dados de métricas
   * @returns Contagem de métricas criadas
   * 
   * @example
   * ```typescript
   * const count = await metricsService.createMany([
   *   { metricType: 'latency', value: 100, deploymentId: 'uuid-1' },
   *   { metricType: 'latency', value: 120, deploymentId: 'uuid-2' }
   * ]);
   * ```
   */
  async createMany(dataArray: CreateMetricData[]): Promise<number> {
    logger.debug('MetricsService.createMany', { count: dataArray.length });

    const result = await prisma.systemMetric.createMany({
      data: dataArray.map(data => ({
        metricType: data.metricType,
        value: data.value,
        deploymentId: data.deploymentId,
        metadata: data.metadata as Prisma.InputJsonValue,
        timestamp: data.timestamp || new Date()
      }))
    });

    logger.info('MetricsService.createMany completed', { count: result.count });

    return result.count;
  },

  /**
   * Busca uma métrica por ID
   * 
   * @param id - UUID da métrica
   * @returns Métrica encontrada ou null
   * 
   * @example
   * ```typescript
   * const metric = await metricsService.findById('uuid-here');
   * ```
   */
  async findById(id: string) {
    logger.debug('MetricsService.findById', { id });

    const metric = await prisma.systemMetric.findUnique({
      where: { id }
    });

    if (!metric) {
      logger.warn('MetricsService.findById: Metric not found', { id });
    }

    return metric;
  },

  /**
   * Busca métricas por nome/tipo
   * 
   * @param metricType - Tipo da métrica (ex: 'latency', 'error_rate')
   * @param options - Opções de query
   * @returns Array de métricas
   * 
   * @example
   * ```typescript
   * const metrics = await metricsService.findByName(METRIC_NAMES.LATENCY, {
   *   limit: 100,
   *   order: 'desc'
   * });
   * ```
   */
  async findByName(metricType: string, options: MetricQueryOptions = {}) {
    const limit = Math.min(options.limit || 100, 1000);
    const orderBy = options.orderBy || 'timestamp';
    const order = options.order || 'desc';

    logger.debug('MetricsService.findByName', { metricType, limit });

    const metrics = await prisma.systemMetric.findMany({
      where: { metricType },
      take: limit,
      orderBy: { [orderBy]: order }
    });

    logger.info('MetricsService.findByName completed', {
      metricType,
      count: metrics.length
    });

    return metrics;
  },

  /**
   * Busca métricas por deployment
   * 
   * @param deploymentId - UUID do deployment
   * @param options - Opções de query
   * @returns Array de métricas do deployment
   * 
   * @example
   * ```typescript
   * const metrics = await metricsService.findByDeployment('uuid-deployment');
   * ```
   */
  async findByDeployment(deploymentId: string, options: MetricQueryOptions = {}) {
    const limit = Math.min(options.limit || 100, 1000);
    const orderBy = options.orderBy || 'timestamp';
    const order = options.order || 'desc';

    logger.debug('MetricsService.findByDeployment', { deploymentId, limit });

    const metrics = await prisma.systemMetric.findMany({
      where: { deploymentId },
      take: limit,
      orderBy: { [orderBy]: order }
    });

    logger.info('MetricsService.findByDeployment completed', {
      deploymentId,
      count: metrics.length
    });

    return metrics;
  },

  /**
   * Busca métricas por intervalo de tempo
   * 
   * @param startTime - Data/hora inicial
   * @param endTime - Data/hora final
   * @param options - Opções de query
   * @returns Array de métricas no intervalo
   * 
   * @example
   * ```typescript
   * const metrics = await metricsService.findByTimeRange(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31'),
   *   { limit: 500 }
   * );
   * ```
   */
  async findByTimeRange(
    startTime: Date,
    endTime: Date,
    options: MetricQueryOptions = {}
  ) {
    const limit = Math.min(options.limit || 100, 1000);
    const orderBy = options.orderBy || 'timestamp';
    const order = options.order || 'desc';

    logger.debug('MetricsService.findByTimeRange', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      limit
    });

    const metrics = await prisma.systemMetric.findMany({
      where: {
        timestamp: {
          gte: startTime,
          lte: endTime
        }
      },
      take: limit,
      orderBy: { [orderBy]: order }
    });

    logger.info('MetricsService.findByTimeRange completed', {
      count: metrics.length
    });

    return metrics;
  },

  /**
   * Deleta uma métrica por ID
   * 
   * @param id - UUID da métrica
   * @returns true se deletada, false se não encontrada
   * 
   * @example
   * ```typescript
   * const deleted = await metricsService.delete('uuid-here');
   * ```
   */
  async delete(id: string): Promise<boolean> {
    logger.debug('MetricsService.delete', { id });

    try {
      const existing = await prisma.systemMetric.findUnique({ where: { id } });
      if (!existing) {
        logger.warn('MetricsService.delete: Metric not found', { id });
        return false;
      }

      await prisma.systemMetric.delete({ where: { id } });

      logger.info('MetricsService.delete completed', { id });
      return true;
    } catch (error) {
      logger.error('MetricsService.delete failed', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  /**
   * Deleta métricas mais antigas que uma data
   * Útil para limpeza periódica de métricas antigas
   * 
   * @param date - Data limite (métricas anteriores serão deletadas)
   * @returns Número de métricas deletadas
   * 
   * @example
   * ```typescript
   * // Deletar métricas com mais de 30 dias
   * const thirtyDaysAgo = new Date();
   * thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
   * const deleted = await metricsService.deleteOlderThan(thirtyDaysAgo);
   * ```
   */
  async deleteOlderThan(date: Date): Promise<number> {
    logger.info('MetricsService.deleteOlderThan', {
      date: date.toISOString()
    });

    const result = await prisma.systemMetric.deleteMany({
      where: {
        timestamp: {
          lt: date
        }
      }
    });

    logger.info('MetricsService.deleteOlderThan completed', {
      deletedCount: result.count
    });

    return result.count;
  },

  // ==========================================================================
  // MÉTODOS DE AGREGAÇÃO
  // ==========================================================================

  /**
   * Calcula a média de uma métrica
   * 
   * @param metricType - Tipo da métrica
   * @param timeRange - Intervalo de tempo opcional
   * @returns Resultado da agregação com valor médio
   * 
   * @example
   * ```typescript
   * const avg = await metricsService.getAverage(METRIC_NAMES.LATENCY, {
   *   startTime: new Date('2024-01-01'),
   *   endTime: new Date('2024-01-31')
   * });
   * ```
   */
  async getAverage(
    metricType: string,
    timeRange?: TimeRange
  ): Promise<AggregationResult> {
    logger.debug('MetricsService.getAverage', { metricType, timeRange });

    const where: Prisma.SystemMetricWhereInput = { metricType };
    if (timeRange) {
      where.timestamp = {
        gte: timeRange.startTime,
        lte: timeRange.endTime
      };
    }

    const result = await prisma.systemMetric.aggregate({
      where,
      _avg: { value: true },
      _count: { value: true }
    });

    return {
      value: result._avg.value,
      count: result._count.value,
      metricType,
      timeRange
    };
  },

  /**
   * Calcula a soma de uma métrica
   * 
   * @param metricType - Tipo da métrica
   * @param timeRange - Intervalo de tempo opcional
   * @returns Resultado da agregação com soma
   * 
   * @example
   * ```typescript
   * const sum = await metricsService.getSum(METRIC_NAMES.COST);
   * ```
   */
  async getSum(
    metricType: string,
    timeRange?: TimeRange
  ): Promise<AggregationResult> {
    logger.debug('MetricsService.getSum', { metricType, timeRange });

    const where: Prisma.SystemMetricWhereInput = { metricType };
    if (timeRange) {
      where.timestamp = {
        gte: timeRange.startTime,
        lte: timeRange.endTime
      };
    }

    const result = await prisma.systemMetric.aggregate({
      where,
      _sum: { value: true },
      _count: { value: true }
    });

    return {
      value: result._sum.value,
      count: result._count.value,
      metricType,
      timeRange
    };
  },

  /**
   * Obtém o valor mínimo de uma métrica
   * 
   * @param metricType - Tipo da métrica
   * @param timeRange - Intervalo de tempo opcional
   * @returns Resultado da agregação com valor mínimo
   * 
   * @example
   * ```typescript
   * const min = await metricsService.getMin(METRIC_NAMES.LATENCY);
   * ```
   */
  async getMin(
    metricType: string,
    timeRange?: TimeRange
  ): Promise<AggregationResult> {
    logger.debug('MetricsService.getMin', { metricType, timeRange });

    const where: Prisma.SystemMetricWhereInput = { metricType };
    if (timeRange) {
      where.timestamp = {
        gte: timeRange.startTime,
        lte: timeRange.endTime
      };
    }

    const result = await prisma.systemMetric.aggregate({
      where,
      _min: { value: true },
      _count: { value: true }
    });

    return {
      value: result._min.value,
      count: result._count.value,
      metricType,
      timeRange
    };
  },

  /**
   * Obtém o valor máximo de uma métrica
   * 
   * @param metricType - Tipo da métrica
   * @param timeRange - Intervalo de tempo opcional
   * @returns Resultado da agregação com valor máximo
   * 
   * @example
   * ```typescript
   * const max = await metricsService.getMax(METRIC_NAMES.LATENCY);
   * ```
   */
  async getMax(
    metricType: string,
    timeRange?: TimeRange
  ): Promise<AggregationResult> {
    logger.debug('MetricsService.getMax', { metricType, timeRange });

    const where: Prisma.SystemMetricWhereInput = { metricType };
    if (timeRange) {
      where.timestamp = {
        gte: timeRange.startTime,
        lte: timeRange.endTime
      };
    }

    const result = await prisma.systemMetric.aggregate({
      where,
      _max: { value: true },
      _count: { value: true }
    });

    return {
      value: result._max.value,
      count: result._count.value,
      metricType,
      timeRange
    };
  },

  /**
   * Conta registros de uma métrica
   * 
   * @param metricType - Tipo da métrica
   * @param timeRange - Intervalo de tempo opcional
   * @returns Resultado da agregação com contagem
   * 
   * @example
   * ```typescript
   * const count = await metricsService.getCount(METRIC_NAMES.REQUEST_COUNT);
   * ```
   */
  async getCount(
    metricType: string,
    timeRange?: TimeRange
  ): Promise<AggregationResult> {
    logger.debug('MetricsService.getCount', { metricType, timeRange });

    const where: Prisma.SystemMetricWhereInput = { metricType };
    if (timeRange) {
      where.timestamp = {
        gte: timeRange.startTime,
        lte: timeRange.endTime
      };
    }

    const count = await prisma.systemMetric.count({ where });

    return {
      value: count,
      count,
      metricType,
      timeRange
    };
  },

  /**
   * Calcula percentil de uma métrica
   * 
   * NOTA: PostgreSQL não tem função nativa de percentil via Prisma,
   * então usamos uma aproximação ordenando e pegando o valor na posição.
   * 
   * @param metricType - Tipo da métrica
   * @param percentile - Percentil desejado (0-100, ex: 50, 95, 99)
   * @param timeRange - Intervalo de tempo opcional
   * @returns Valor do percentil
   * 
   * @example
   * ```typescript
   * const p95 = await metricsService.getPercentile(METRIC_NAMES.LATENCY, 95);
   * const p99 = await metricsService.getPercentile(METRIC_NAMES.LATENCY, 99);
   * ```
   */
  async getPercentile(
    metricType: string,
    percentile: number,
    timeRange?: TimeRange
  ): Promise<number | null> {
    if (percentile < 0 || percentile > 100) {
      throw new Error('Percentile must be between 0 and 100');
    }

    logger.debug('MetricsService.getPercentile', {
      metricType,
      percentile,
      timeRange
    });

    const where: Prisma.SystemMetricWhereInput = { metricType };
    if (timeRange) {
      where.timestamp = {
        gte: timeRange.startTime,
        lte: timeRange.endTime
      };
    }

    // Contar total de registros
    const total = await prisma.systemMetric.count({ where });
    if (total === 0) {
      return null;
    }

    // Calcular posição do percentil
    const position = Math.ceil((percentile / 100) * total) - 1;

    // Buscar valor na posição
    const metrics = await prisma.systemMetric.findMany({
      where,
      orderBy: { value: 'asc' },
      skip: Math.max(0, position),
      take: 1,
      select: { value: true }
    });

    return metrics.length > 0 ? metrics[0].value : null;
  },

  // ==========================================================================
  // MÉTODOS DE ANÁLISE
  // ==========================================================================

  /**
   * Obtém o último valor de uma métrica
   * 
   * @param metricType - Tipo da métrica
   * @param deploymentId - ID do deployment opcional
   * @returns Última métrica ou null
   * 
   * @example
   * ```typescript
   * const latest = await metricsService.getLatestValue(
   *   METRIC_NAMES.LATENCY,
   *   'uuid-deployment'
   * );
   * ```
   */
  async getLatestValue(metricType: string, deploymentId?: string) {
    logger.debug('MetricsService.getLatestValue', { metricType, deploymentId });

    const where: Prisma.SystemMetricWhereInput = { metricType };
    if (deploymentId) {
      where.deploymentId = deploymentId;
    }

    const metric = await prisma.systemMetric.findFirst({
      where,
      orderBy: { timestamp: 'desc' }
    });

    return metric;
  },

  /**
   * Obtém tendência de uma métrica ao longo do tempo
   * 
   * @param metricType - Tipo da métrica
   * @param timeRange - Intervalo de tempo
   * @param interval - Intervalo de agrupamento ('hour', 'day', 'week')
   * @returns Resultado com pontos de dados da tendência
   * 
   * @example
   * ```typescript
   * const trend = await metricsService.getTrend(
   *   METRIC_NAMES.LATENCY,
   *   { startTime: new Date('2024-01-01'), endTime: new Date('2024-01-31') },
   *   'day'
   * );
   * ```
   */
  async getTrend(
    metricType: string,
    timeRange: TimeRange,
    interval: 'hour' | 'day' | 'week'
  ): Promise<TrendResult> {
    logger.debug('MetricsService.getTrend', { metricType, timeRange, interval });

    // Buscar todas as métricas no intervalo
    const metrics = await prisma.systemMetric.findMany({
      where: {
        metricType,
        timestamp: {
          gte: timeRange.startTime,
          lte: timeRange.endTime
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    // Agrupar por intervalo
    const groups = new Map<string, { values: number[]; timestamp: Date }>();

    for (const metric of metrics) {
      const key = this.getIntervalKey(metric.timestamp, interval);
      if (!groups.has(key)) {
        groups.set(key, {
          values: [],
          timestamp: this.getIntervalStart(metric.timestamp, interval)
        });
      }
      groups.get(key)!.values.push(metric.value);
    }

    // Calcular média por intervalo
    const dataPoints: TrendDataPoint[] = [];
    const groupEntries = Array.from(groups.entries());
    for (const [, group] of groupEntries) {
      const sum = group.values.reduce((a, b) => a + b, 0);
      dataPoints.push({
        timestamp: group.timestamp,
        value: sum / group.values.length,
        count: group.values.length
      });
    }

    // Ordenar por timestamp
    dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      metricType,
      interval,
      dataPoints,
      timeRange
    };
  },

  /**
   * Compara métricas entre múltiplos deployments
   * 
   * @param metricType - Tipo da métrica
   * @param deploymentIds - Array de IDs de deployments
   * @param timeRange - Intervalo de tempo opcional
   * @returns Comparação entre deployments
   * 
   * @example
   * ```typescript
   * const comparison = await metricsService.compareDeployments(
   *   METRIC_NAMES.LATENCY,
   *   ['uuid-1', 'uuid-2', 'uuid-3']
   * );
   * ```
   */
  async compareDeployments(
    metricType: string,
    deploymentIds: string[],
    timeRange?: TimeRange
  ): Promise<ComparisonResult> {
    logger.debug('MetricsService.compareDeployments', {
      metricType,
      deploymentIds,
      timeRange
    });

    const deployments: DeploymentComparison[] = [];

    for (const deploymentId of deploymentIds) {
      const where: Prisma.SystemMetricWhereInput = {
        metricType,
        deploymentId
      };

      if (timeRange) {
        where.timestamp = {
          gte: timeRange.startTime,
          lte: timeRange.endTime
        };
      }

      const result = await prisma.systemMetric.aggregate({
        where,
        _avg: { value: true },
        _min: { value: true },
        _max: { value: true },
        _count: { value: true }
      });

      deployments.push({
        deploymentId,
        average: result._avg.value,
        min: result._min.value,
        max: result._max.value,
        count: result._count.value
      });
    }

    return {
      metricType,
      timeRange,
      deployments
    };
  },

  // ==========================================================================
  // MÉTODOS DE CONVENIÊNCIA
  // ==========================================================================

  /**
   * Registra latência de uma requisição
   * 
   * @param deploymentId - ID do deployment
   * @param latencyMs - Latência em milissegundos
   * @param metadata - Metadados adicionais opcionais
   * @returns Métrica criada
   * 
   * @example
   * ```typescript
   * await metricsService.recordLatency('uuid-deployment', 150, {
   *   region: 'us-east-1'
   * });
   * ```
   */
  async recordLatency(
    deploymentId: string,
    latencyMs: number,
    metadata?: MetricMetadata
  ) {
    return this.create({
      metricType: METRIC_NAMES.LATENCY,
      value: latencyMs,
      deploymentId,
      metadata
    });
  },

  /**
   * Registra uso de tokens
   * 
   * @param deploymentId - ID do deployment
   * @param inputTokens - Número de tokens de entrada
   * @param outputTokens - Número de tokens de saída
   * @param metadata - Metadados adicionais opcionais
   * @returns Array com métricas criadas
   * 
   * @example
   * ```typescript
   * await metricsService.recordTokenUsage('uuid-deployment', 500, 200);
   * ```
   */
  async recordTokenUsage(
    deploymentId: string,
    inputTokens: number,
    outputTokens: number,
    metadata?: MetricMetadata
  ) {
    const timestamp = new Date();

    const metrics = await this.createMany([
      {
        metricType: METRIC_NAMES.INPUT_TOKENS,
        value: inputTokens,
        deploymentId,
        metadata,
        timestamp
      },
      {
        metricType: METRIC_NAMES.OUTPUT_TOKENS,
        value: outputTokens,
        deploymentId,
        metadata,
        timestamp
      },
      {
        metricType: METRIC_NAMES.TOKEN_COUNT,
        value: inputTokens + outputTokens,
        deploymentId,
        metadata,
        timestamp
      }
    ]);

    return metrics;
  },

  /**
   * Registra um erro
   * 
   * @param deploymentId - ID do deployment
   * @param errorType - Tipo do erro (ex: 'timeout', 'rate_limit', 'auth_error')
   * @param metadata - Metadados adicionais opcionais
   * @returns Métrica criada
   * 
   * @example
   * ```typescript
   * await metricsService.recordError('uuid-deployment', 'timeout', {
   *   region: 'us-east-1',
   *   message: 'Request timed out after 30s'
   * });
   * ```
   */
  async recordError(
    deploymentId: string,
    errorType: string,
    metadata?: MetricMetadata
  ) {
    return this.create({
      metricType: METRIC_NAMES.ERROR_COUNT,
      value: 1,
      deploymentId,
      metadata: {
        ...metadata,
        errorType
      }
    });
  },

  /**
   * Registra custo de uma requisição
   * 
   * @param deploymentId - ID do deployment
   * @param cost - Custo em USD
   * @param metadata - Metadados adicionais opcionais
   * @returns Métrica criada
   * 
   * @example
   * ```typescript
   * await metricsService.recordCost('uuid-deployment', 0.0025, {
   *   inputTokens: 500,
   *   outputTokens: 200
   * });
   * ```
   */
  async recordCost(
    deploymentId: string,
    cost: number,
    metadata?: MetricMetadata
  ) {
    return this.create({
      metricType: METRIC_NAMES.COST,
      value: cost,
      deploymentId,
      metadata
    });
  },

  // ==========================================================================
  // MÉTODOS AUXILIARES (PRIVADOS)
  // ==========================================================================

  /**
   * Gera chave de agrupamento para intervalo de tempo
   * @internal
   */
  getIntervalKey(date: Date, interval: 'hour' | 'day' | 'week'): string {
    const d = new Date(date);
    switch (interval) {
      case 'hour':
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      case 'day':
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      case 'week': {
        // Calcular início da semana (domingo)
        const dayOfWeek = d.getDay();
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - dayOfWeek);
        return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
      }
      default:
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }
  },

  /**
   * Obtém o início do intervalo de tempo
   * @internal
   */
  getIntervalStart(date: Date, interval: 'hour' | 'day' | 'week'): Date {
    const d = new Date(date);
    switch (interval) {
      case 'hour':
        d.setMinutes(0, 0, 0);
        return d;
      case 'day':
        d.setHours(0, 0, 0, 0);
        return d;
      case 'week': {
        // Início da semana (domingo)
        const dayOfWeek = d.getDay();
        d.setDate(d.getDate() - dayOfWeek);
        d.setHours(0, 0, 0, 0);
        return d;
      }
      default:
        d.setHours(0, 0, 0, 0);
        return d;
    }
  }
};