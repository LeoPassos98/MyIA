// backend/src/services/models/__tests__/metricsService.test.ts
// Standards: docs/STANDARDS.md

import { metricsService, METRIC_NAMES } from '../metricsService';
import { prisma } from '../../../lib/prisma';

// Mock do Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    systemMetric: {
      create: jest.fn(),
      createMany: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn()
    }
  }
}));

// Mock do logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('MetricsService', () => {
  // Dados de mock reutilizáveis
  const mockMetric = {
    id: 'uuid-metric-1',
    metricType: 'latency',
    value: 150,
    deploymentId: 'uuid-deployment-1',
    metadata: { region: 'us-east-1' },
    timestamp: new Date('2024-01-15T10:00:00Z')
  };

  const mockMetric2 = {
    ...mockMetric,
    id: 'uuid-metric-2',
    value: 200,
    timestamp: new Date('2024-01-15T11:00:00Z')
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // create
  // ============================================================================
  describe('create', () => {
    it('should create a metric successfully', async () => {
      (prisma.systemMetric.create as jest.Mock).mockResolvedValue(mockMetric);

      const result = await metricsService.create({
        metricType: METRIC_NAMES.LATENCY,
        value: 150,
        deploymentId: 'uuid-deployment-1',
        metadata: { region: 'us-east-1' }
      });

      expect(result).toEqual(mockMetric);
      expect(prisma.systemMetric.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metricType: 'latency',
          value: 150,
          deploymentId: 'uuid-deployment-1'
        })
      });
    });

    it('should create metric without deploymentId', async () => {
      const metricWithoutDeployment = { ...mockMetric, deploymentId: undefined };
      (prisma.systemMetric.create as jest.Mock).mockResolvedValue(metricWithoutDeployment);

      const result = await metricsService.create({
        metricType: METRIC_NAMES.ERROR_COUNT,
        value: 1
      });

      expect(result.deploymentId).toBeUndefined();
    });

    it('should use provided timestamp', async () => {
      const customTimestamp = new Date('2024-01-01T00:00:00Z');
      (prisma.systemMetric.create as jest.Mock).mockResolvedValue({
        ...mockMetric,
        timestamp: customTimestamp
      });

      await metricsService.create({
        metricType: METRIC_NAMES.LATENCY,
        value: 100,
        timestamp: customTimestamp
      });

      expect(prisma.systemMetric.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timestamp: customTimestamp
        })
      });
    });
  });

  // ============================================================================
  // createMany
  // ============================================================================
  describe('createMany', () => {
    it('should create multiple metrics in batch', async () => {
      (prisma.systemMetric.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await metricsService.createMany([
        { metricType: 'latency', value: 100, deploymentId: 'uuid-1' },
        { metricType: 'latency', value: 120, deploymentId: 'uuid-2' },
        { metricType: 'latency', value: 110, deploymentId: 'uuid-3' }
      ]);

      expect(result).toBe(3);
      expect(prisma.systemMetric.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ metricType: 'latency', value: 100 }),
          expect.objectContaining({ metricType: 'latency', value: 120 }),
          expect.objectContaining({ metricType: 'latency', value: 110 })
        ])
      });
    });

    it('should return 0 for empty array', async () => {
      (prisma.systemMetric.createMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await metricsService.createMany([]);

      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // findById
  // ============================================================================
  describe('findById', () => {
    it('should return metric when found', async () => {
      (prisma.systemMetric.findUnique as jest.Mock).mockResolvedValue(mockMetric);

      const result = await metricsService.findById('uuid-metric-1');

      expect(result).toEqual(mockMetric);
      expect(prisma.systemMetric.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-metric-1' }
      });
    });

    it('should return null when metric not found', async () => {
      (prisma.systemMetric.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await metricsService.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // findByName
  // ============================================================================
  describe('findByName', () => {
    it('should return metrics by type', async () => {
      (prisma.systemMetric.findMany as jest.Mock).mockResolvedValue([mockMetric, mockMetric2]);

      const result = await metricsService.findByName(METRIC_NAMES.LATENCY);

      expect(result).toHaveLength(2);
      expect(prisma.systemMetric.findMany).toHaveBeenCalledWith({
        where: { metricType: 'latency' },
        take: 100,
        orderBy: { timestamp: 'desc' }
      });
    });

    it('should respect limit option', async () => {
      (prisma.systemMetric.findMany as jest.Mock).mockResolvedValue([mockMetric]);

      await metricsService.findByName(METRIC_NAMES.LATENCY, { limit: 50 });

      expect(prisma.systemMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });

    it('should cap limit at 1000', async () => {
      (prisma.systemMetric.findMany as jest.Mock).mockResolvedValue([]);

      await metricsService.findByName(METRIC_NAMES.LATENCY, { limit: 5000 });

      expect(prisma.systemMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1000 })
      );
    });

    it('should apply custom ordering', async () => {
      (prisma.systemMetric.findMany as jest.Mock).mockResolvedValue([]);

      await metricsService.findByName(METRIC_NAMES.LATENCY, {
        orderBy: 'value',
        order: 'asc'
      });

      expect(prisma.systemMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { value: 'asc' } })
      );
    });
  });

  // ============================================================================
  // findByDeployment
  // ============================================================================
  describe('findByDeployment', () => {
    it('should return metrics for specific deployment', async () => {
      (prisma.systemMetric.findMany as jest.Mock).mockResolvedValue([mockMetric]);

      const result = await metricsService.findByDeployment('uuid-deployment-1');

      expect(result).toHaveLength(1);
      expect(prisma.systemMetric.findMany).toHaveBeenCalledWith({
        where: { deploymentId: 'uuid-deployment-1' },
        take: 100,
        orderBy: { timestamp: 'desc' }
      });
    });
  });

  // ============================================================================
  // findByTimeRange
  // ============================================================================
  describe('findByTimeRange', () => {
    it('should return metrics within time range', async () => {
      (prisma.systemMetric.findMany as jest.Mock).mockResolvedValue([mockMetric, mockMetric2]);

      const startTime = new Date('2024-01-01');
      const endTime = new Date('2024-01-31');

      const result = await metricsService.findByTimeRange(startTime, endTime);

      expect(result).toHaveLength(2);
      expect(prisma.systemMetric.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: startTime,
            lte: endTime
          }
        },
        take: 100,
        orderBy: { timestamp: 'desc' }
      });
    });
  });

  // ============================================================================
  // delete
  // ============================================================================
  describe('delete', () => {
    it('should delete metric successfully', async () => {
      (prisma.systemMetric.findUnique as jest.Mock).mockResolvedValue(mockMetric);
      (prisma.systemMetric.delete as jest.Mock).mockResolvedValue(mockMetric);

      const result = await metricsService.delete('uuid-metric-1');

      expect(result).toBe(true);
      expect(prisma.systemMetric.delete).toHaveBeenCalledWith({
        where: { id: 'uuid-metric-1' }
      });
    });

    it('should return false when metric not found', async () => {
      (prisma.systemMetric.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await metricsService.delete('non-existent');

      expect(result).toBe(false);
      expect(prisma.systemMetric.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // deleteOlderThan
  // ============================================================================
  describe('deleteOlderThan', () => {
    it('should delete metrics older than specified date', async () => {
      (prisma.systemMetric.deleteMany as jest.Mock).mockResolvedValue({ count: 100 });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await metricsService.deleteOlderThan(thirtyDaysAgo);

      expect(result).toBe(100);
      expect(prisma.systemMetric.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: thirtyDaysAgo
          }
        }
      });
    });

    it('should return 0 when no metrics to delete', async () => {
      (prisma.systemMetric.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await metricsService.deleteOlderThan(new Date());

      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // getAverage
  // ============================================================================
  describe('getAverage', () => {
    it('should calculate average correctly', async () => {
      (prisma.systemMetric.aggregate as jest.Mock).mockResolvedValue({
        _avg: { value: 175 },
        _count: { value: 2 }
      });

      const result = await metricsService.getAverage(METRIC_NAMES.LATENCY);

      expect(result.value).toBe(175);
      expect(result.count).toBe(2);
      expect(result.metricType).toBe('latency');
    });

    it('should apply time range filter', async () => {
      (prisma.systemMetric.aggregate as jest.Mock).mockResolvedValue({
        _avg: { value: 150 },
        _count: { value: 10 }
      });

      const timeRange = {
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-01-31')
      };

      const result = await metricsService.getAverage(METRIC_NAMES.LATENCY, timeRange);

      expect(result.timeRange).toEqual(timeRange);
      expect(prisma.systemMetric.aggregate).toHaveBeenCalledWith({
        where: {
          metricType: 'latency',
          timestamp: {
            gte: timeRange.startTime,
            lte: timeRange.endTime
          }
        },
        _avg: { value: true },
        _count: { value: true }
      });
    });

    it('should return null value when no metrics', async () => {
      (prisma.systemMetric.aggregate as jest.Mock).mockResolvedValue({
        _avg: { value: null },
        _count: { value: 0 }
      });

      const result = await metricsService.getAverage(METRIC_NAMES.LATENCY);

      expect(result.value).toBeNull();
      expect(result.count).toBe(0);
    });
  });

  // ============================================================================
  // getSum
  // ============================================================================
  describe('getSum', () => {
    it('should calculate sum correctly', async () => {
      (prisma.systemMetric.aggregate as jest.Mock).mockResolvedValue({
        _sum: { value: 1000 },
        _count: { value: 10 }
      });

      const result = await metricsService.getSum(METRIC_NAMES.COST);

      expect(result.value).toBe(1000);
      expect(result.count).toBe(10);
      expect(result.metricType).toBe('cost');
    });
  });

  // ============================================================================
  // getMin
  // ============================================================================
  describe('getMin', () => {
    it('should get minimum value correctly', async () => {
      (prisma.systemMetric.aggregate as jest.Mock).mockResolvedValue({
        _min: { value: 50 },
        _count: { value: 100 }
      });

      const result = await metricsService.getMin(METRIC_NAMES.LATENCY);

      expect(result.value).toBe(50);
      expect(result.count).toBe(100);
    });
  });

  // ============================================================================
  // getMax
  // ============================================================================
  describe('getMax', () => {
    it('should get maximum value correctly', async () => {
      (prisma.systemMetric.aggregate as jest.Mock).mockResolvedValue({
        _max: { value: 500 },
        _count: { value: 100 }
      });

      const result = await metricsService.getMax(METRIC_NAMES.LATENCY);

      expect(result.value).toBe(500);
      expect(result.count).toBe(100);
    });
  });

  // ============================================================================
  // getCount
  // ============================================================================
  describe('getCount', () => {
    it('should count metrics correctly', async () => {
      (prisma.systemMetric.count as jest.Mock).mockResolvedValue(50);

      const result = await metricsService.getCount(METRIC_NAMES.REQUEST_COUNT);

      expect(result.value).toBe(50);
      expect(result.count).toBe(50);
    });
  });

  // ============================================================================
  // getPercentile
  // ============================================================================
  describe('getPercentile', () => {
    it('should calculate percentile correctly', async () => {
      (prisma.systemMetric.count as jest.Mock).mockResolvedValue(100);
      (prisma.systemMetric.findMany as jest.Mock).mockResolvedValue([{ value: 250 }]);

      const result = await metricsService.getPercentile(METRIC_NAMES.LATENCY, 95);

      expect(result).toBe(250);
      expect(prisma.systemMetric.findMany).toHaveBeenCalledWith({
        where: { metricType: 'latency' },
        orderBy: { value: 'asc' },
        skip: 94, // 95th percentile of 100 items
        take: 1,
        select: { value: true }
      });
    });

    it('should return null when no metrics', async () => {
      (prisma.systemMetric.count as jest.Mock).mockResolvedValue(0);

      const result = await metricsService.getPercentile(METRIC_NAMES.LATENCY, 95);

      expect(result).toBeNull();
    });

    it('should throw error for invalid percentile', async () => {
      await expect(
        metricsService.getPercentile(METRIC_NAMES.LATENCY, 150)
      ).rejects.toThrow('Percentile must be between 0 and 100');

      await expect(
        metricsService.getPercentile(METRIC_NAMES.LATENCY, -10)
      ).rejects.toThrow('Percentile must be between 0 and 100');
    });
  });

  // ============================================================================
  // recordLatency
  // ============================================================================
  describe('recordLatency', () => {
    it('should record latency metric', async () => {
      (prisma.systemMetric.create as jest.Mock).mockResolvedValue(mockMetric);

      await metricsService.recordLatency('uuid-deployment-1', 150, { region: 'us-east-1' });

      expect(prisma.systemMetric.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metricType: 'latency',
          value: 150,
          deploymentId: 'uuid-deployment-1',
          metadata: { region: 'us-east-1' }
        })
      });
    });
  });

  // ============================================================================
  // recordTokenUsage
  // ============================================================================
  describe('recordTokenUsage', () => {
    it('should record input, output and total token metrics', async () => {
      (prisma.systemMetric.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await metricsService.recordTokenUsage('uuid-deployment-1', 500, 200);

      expect(result).toBe(3);
      expect(prisma.systemMetric.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ metricType: 'input_tokens', value: 500 }),
          expect.objectContaining({ metricType: 'output_tokens', value: 200 }),
          expect.objectContaining({ metricType: 'token_count', value: 700 })
        ])
      });
    });
  });

  // ============================================================================
  // recordError
  // ============================================================================
  describe('recordError', () => {
    it('should record error metric with error type', async () => {
      (prisma.systemMetric.create as jest.Mock).mockResolvedValue({
        ...mockMetric,
        metricType: 'error_count',
        value: 1
      });

      await metricsService.recordError('uuid-deployment-1', 'timeout', {
        message: 'Request timed out'
      });

      expect(prisma.systemMetric.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metricType: 'error_count',
          value: 1,
          deploymentId: 'uuid-deployment-1',
          metadata: expect.objectContaining({
            errorType: 'timeout',
            message: 'Request timed out'
          })
        })
      });
    });
  });

  // ============================================================================
  // recordCost
  // ============================================================================
  describe('recordCost', () => {
    it('should record cost metric', async () => {
      (prisma.systemMetric.create as jest.Mock).mockResolvedValue({
        ...mockMetric,
        metricType: 'cost',
        value: 0.0025
      });

      await metricsService.recordCost('uuid-deployment-1', 0.0025, {
        inputTokens: 500,
        outputTokens: 200
      });

      expect(prisma.systemMetric.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metricType: 'cost',
          value: 0.0025,
          deploymentId: 'uuid-deployment-1'
        })
      });
    });
  });

  // ============================================================================
  // getLatestValue
  // ============================================================================
  describe('getLatestValue', () => {
    it('should return latest metric value', async () => {
      (prisma.systemMetric.findFirst as jest.Mock).mockResolvedValue(mockMetric2);

      const result = await metricsService.getLatestValue(METRIC_NAMES.LATENCY);

      expect(result).toEqual(mockMetric2);
      expect(prisma.systemMetric.findFirst).toHaveBeenCalledWith({
        where: { metricType: 'latency' },
        orderBy: { timestamp: 'desc' }
      });
    });

    it('should filter by deployment when provided', async () => {
      (prisma.systemMetric.findFirst as jest.Mock).mockResolvedValue(mockMetric);

      await metricsService.getLatestValue(METRIC_NAMES.LATENCY, 'uuid-deployment-1');

      expect(prisma.systemMetric.findFirst).toHaveBeenCalledWith({
        where: {
          metricType: 'latency',
          deploymentId: 'uuid-deployment-1'
        },
        orderBy: { timestamp: 'desc' }
      });
    });
  });

  // ============================================================================
  // getTrend
  // ============================================================================
  describe('getTrend', () => {
    it('should return trend data grouped by day', async () => {
      const metrics = [
        { ...mockMetric, timestamp: new Date('2024-01-15T10:00:00Z'), value: 100 },
        { ...mockMetric, timestamp: new Date('2024-01-15T14:00:00Z'), value: 150 },
        { ...mockMetric, timestamp: new Date('2024-01-16T10:00:00Z'), value: 200 }
      ];
      (prisma.systemMetric.findMany as jest.Mock).mockResolvedValue(metrics);

      const timeRange = {
        startTime: new Date('2024-01-15'),
        endTime: new Date('2024-01-17')
      };

      const result = await metricsService.getTrend(METRIC_NAMES.LATENCY, timeRange, 'day');

      expect(result.metricType).toBe('latency');
      expect(result.interval).toBe('day');
      expect(result.dataPoints).toHaveLength(2); // 2 dias diferentes
      expect(result.timeRange).toEqual(timeRange);
    });

    it('should return trend data grouped by hour', async () => {
      const metrics = [
        { ...mockMetric, timestamp: new Date('2024-01-15T10:00:00Z'), value: 100 },
        { ...mockMetric, timestamp: new Date('2024-01-15T10:30:00Z'), value: 150 },
        { ...mockMetric, timestamp: new Date('2024-01-15T11:00:00Z'), value: 200 }
      ];
      (prisma.systemMetric.findMany as jest.Mock).mockResolvedValue(metrics);

      const timeRange = {
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T12:00:00Z')
      };

      const result = await metricsService.getTrend(METRIC_NAMES.LATENCY, timeRange, 'hour');

      expect(result.interval).toBe('hour');
      expect(result.dataPoints).toHaveLength(2); // 2 horas diferentes
    });
  });

  // ============================================================================
  // compareDeployments
  // ============================================================================
  describe('compareDeployments', () => {
    it('should compare metrics between deployments', async () => {
      (prisma.systemMetric.aggregate as jest.Mock)
        .mockResolvedValueOnce({
          _avg: { value: 150 },
          _min: { value: 100 },
          _max: { value: 200 },
          _count: { value: 10 }
        })
        .mockResolvedValueOnce({
          _avg: { value: 180 },
          _min: { value: 120 },
          _max: { value: 250 },
          _count: { value: 15 }
        });

      const result = await metricsService.compareDeployments(
        METRIC_NAMES.LATENCY,
        ['uuid-1', 'uuid-2']
      );

      expect(result.metricType).toBe('latency');
      expect(result.deployments).toHaveLength(2);
      expect(result.deployments[0]).toEqual({
        deploymentId: 'uuid-1',
        average: 150,
        min: 100,
        max: 200,
        count: 10
      });
      expect(result.deployments[1]).toEqual({
        deploymentId: 'uuid-2',
        average: 180,
        min: 120,
        max: 250,
        count: 15
      });
    });

    it('should apply time range filter when provided', async () => {
      (prisma.systemMetric.aggregate as jest.Mock).mockResolvedValue({
        _avg: { value: 150 },
        _min: { value: 100 },
        _max: { value: 200 },
        _count: { value: 10 }
      });

      const timeRange = {
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-01-31')
      };

      const result = await metricsService.compareDeployments(
        METRIC_NAMES.LATENCY,
        ['uuid-1'],
        timeRange
      );

      expect(result.timeRange).toEqual(timeRange);
    });
  });

  // ============================================================================
  // Métodos Auxiliares
  // ============================================================================
  describe('getIntervalKey', () => {
    it('should generate correct key for hour interval', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const key = metricsService.getIntervalKey(date, 'hour');

      // Usar a hora local da data em vez de valor hardcoded
      const expectedHour = date.getHours();
      expect(key).toBe(`2024-0-15-${expectedHour}`);
    });

    it('should generate correct key for day interval', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const key = metricsService.getIntervalKey(date, 'day');

      expect(key).toBe('2024-0-15');
    });

    it('should generate correct key for week interval', () => {
      const date = new Date('2024-01-17T14:30:00Z'); // Wednesday
      const key = metricsService.getIntervalKey(date, 'week');

      // Should be Sunday of that week (Jan 14)
      expect(key).toBe('2024-0-14');
    });
  });

  describe('getIntervalStart', () => {
    it('should return start of hour', () => {
      const date = new Date('2024-01-15T14:30:45Z');
      const start = metricsService.getIntervalStart(date, 'hour');

      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
    });

    it('should return start of day', () => {
      const date = new Date('2024-01-15T14:30:45Z');
      const start = metricsService.getIntervalStart(date, 'day');

      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
    });

    it('should return start of week (Sunday)', () => {
      const date = new Date('2024-01-17T14:30:45Z'); // Wednesday
      const start = metricsService.getIntervalStart(date, 'week');

      expect(start.getDay()).toBe(0); // Sunday
      expect(start.getHours()).toBe(0);
    });
  });

  // ============================================================================
  // METRIC_NAMES Constants
  // ============================================================================
  describe('METRIC_NAMES', () => {
    it('should have all expected metric names', () => {
      expect(METRIC_NAMES.LATENCY).toBe('latency');
      expect(METRIC_NAMES.TOKEN_COUNT).toBe('token_count');
      expect(METRIC_NAMES.INPUT_TOKENS).toBe('input_tokens');
      expect(METRIC_NAMES.OUTPUT_TOKENS).toBe('output_tokens');
      expect(METRIC_NAMES.ERROR_RATE).toBe('error_rate');
      expect(METRIC_NAMES.COST).toBe('cost');
      expect(METRIC_NAMES.THROUGHPUT).toBe('throughput');
      expect(METRIC_NAMES.ERROR_COUNT).toBe('error_count');
      expect(METRIC_NAMES.REQUEST_COUNT).toBe('request_count');
      expect(METRIC_NAMES.TIME_TO_FIRST_TOKEN).toBe('time_to_first_token');
    });
  });
});
