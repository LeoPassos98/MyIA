// backend/src/services/ai/rating/__tests__/rating-calculator.test.ts
// Standards: docs/STANDARDS.md

import { RatingCalculator } from '../rating-calculator';
import { ModelMetrics } from '../../../../types/model-rating';

describe('RatingCalculator', () => {
  let calculator: RatingCalculator;

  beforeEach(() => {
    calculator = new RatingCalculator();
  });

  describe('calculateRating', () => {
    it('deve calcular rating perfeito (5.0) para Amazon Nova Micro', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 1285,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('amazon.nova-micro-v1:0', metrics);

      expect(result.rating).toBe(5.0);
      expect(result.badge).toBe('PREMIUM');
      expect(result.scores.success).toBe(4.0);
      expect(result.scores.resilience).toBe(1.0);
      expect(result.scores.performance).toBe(1.0);
      expect(result.scores.stability).toBe(1.0);
    });

    it('deve calcular rating ótimo (~4.3) para Claude 3 Sonnet', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 5963,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('anthropic.claude-3-sonnet-20240229-v1:0', metrics);

      expect(result.rating).toBeGreaterThanOrEqual(4.0);
      expect(result.rating).toBeLessThan(4.5);
      expect(result.badge).toBe('RECOMENDADO');
      expect(result.scores.success).toBe(4.0);
      expect(result.scores.resilience).toBe(1.0);
      expect(result.scores.performance).toBe(0.4); // Latência lenta (5000-10000ms)
      expect(result.scores.stability).toBe(1.0);
    });

    it('deve calcular rating limitado (~2.5) para Claude 3.5 Sonnet', () => {
      const metrics: ModelMetrics = {
        testsPassed: 3,
        totalTests: 7,
        averageRetries: 2.5,
        averageLatency: 5735,
        errorCount: 4,
        successRate: 42.9
      };

      const result = calculator.calculateRating('anthropic.claude-3-5-sonnet-20240620-v1:0', metrics);

      expect(result.rating).toBeGreaterThanOrEqual(2.0);
      expect(result.rating).toBeLessThan(3.0);
      expect(result.badge).toBe('LIMITADO');
      expect(result.scores.success).toBeCloseTo(1.71, 1);
      expect(result.scores.resilience).toBeCloseTo(0.79, 1);
      expect(result.scores.performance).toBe(0.4); // Latência lenta (5000-10000ms)
      expect(result.scores.stability).toBeCloseTo(0.43, 1);
    });

    it('deve calcular rating indisponível (0.0) para modelo sem testes passados', () => {
      const metrics: ModelMetrics = {
        testsPassed: 0,
        totalTests: 7,
        averageRetries: 6,
        averageLatency: 15000,
        errorCount: 7,
        successRate: 0
      };

      const result = calculator.calculateRating('test.failed-model', metrics);

      expect(result.rating).toBeLessThan(1.0);
      expect(result.badge).toBe('INDISPONIVEL');
      expect(result.scores.success).toBe(0);
      expect(result.scores.resilience).toBe(0.5);
      expect(result.scores.performance).toBe(0.2);
      expect(result.scores.stability).toBe(0);
    });

    it('deve lidar com edge case: 0 testes', () => {
      const metrics: ModelMetrics = {
        testsPassed: 0,
        totalTests: 0,
        averageRetries: 0,
        averageLatency: 0,
        errorCount: 0,
        successRate: 0
      };

      const result = calculator.calculateRating('test.no-tests', metrics);

      // Com 0 testes, success=0 e stability=0, mas resilience=1.0 e performance=1.0
      // Rating = 0*0.5 + 1.0 + 1.0 + 1.0 = 2.0
      // Isso é esperado: sem testes, não podemos dizer que o modelo é ruim
      expect(result.rating).toBe(2.0);
      expect(result.badge).toBe('LIMITADO'); // 2.0 = LIMITADO
      expect(result.scores.success).toBe(0);
      expect(result.scores.stability).toBe(0);
    });

    it('deve calcular rating funcional (~3.5) para modelo bom mas lento', () => {
      const metrics: ModelMetrics = {
        testsPassed: 6,
        totalTests: 7,
        averageRetries: 1,
        averageLatency: 8500,
        errorCount: 1,
        successRate: 85.7
      };

      const result = calculator.calculateRating('test.slow-model', metrics);

      expect(result.rating).toBeGreaterThanOrEqual(3.0);
      expect(result.rating).toBeLessThan(4.0);
      expect(result.badge).toBe('FUNCIONAL');
    });

    it('deve calcular rating não recomendado (~1.5) para modelo instável', () => {
      const metrics: ModelMetrics = {
        testsPassed: 2,
        totalTests: 7,
        averageRetries: 4,
        averageLatency: 12000,
        errorCount: 5,
        successRate: 28.6
      };

      const result = calculator.calculateRating('test.unstable-model', metrics);

      expect(result.rating).toBeGreaterThanOrEqual(1.0);
      expect(result.rating).toBeLessThan(2.0);
      expect(result.badge).toBe('NAO_RECOMENDADO');
    });
  });

  describe('Success Score', () => {
    it('deve calcular 4.0 para 100% de sucesso', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 1000,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.success).toBe(4.0);
    });

    it('deve calcular 2.0 para 50% de sucesso', () => {
      const metrics: ModelMetrics = {
        testsPassed: 3.5,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 1000,
        errorCount: 0,
        successRate: 50
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.success).toBe(2.0);
    });

    it('deve calcular 0.0 para 0% de sucesso', () => {
      const metrics: ModelMetrics = {
        testsPassed: 0,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 1000,
        errorCount: 7,
        successRate: 0
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.success).toBe(0);
    });
  });

  describe('Resilience Score', () => {
    it('deve calcular 1.0 para 0 retries', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 1000,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.resilience).toBe(1.0);
    });

    it('deve calcular 0.75 para 3 retries', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 3,
        averageLatency: 1000,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.resilience).toBe(0.75);
    });

    it('deve calcular 0.5 para 6 retries', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 6,
        averageLatency: 1000,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.resilience).toBe(0.5);
    });

    it('deve calcular 0.5 (mínimo) para >6 retries', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 10,
        averageLatency: 1000,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.resilience).toBe(0.5);
    });
  });

  describe('Performance Score', () => {
    it('deve calcular 1.0 para latência < 2000ms', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 1500,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.performance).toBe(1.0);
    });

    it('deve calcular 0.7 para latência entre 2000-5000ms', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 3500,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.performance).toBe(0.7);
    });

    it('deve calcular 0.4 para latência entre 5000-10000ms', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 7500,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.performance).toBe(0.4);
    });

    it('deve calcular 0.2 para latência >= 10000ms', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 15000,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.performance).toBe(0.2);
    });
  });

  describe('Stability Score', () => {
    it('deve calcular 1.0 para 0 erros', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 1000,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.stability).toBe(1.0);
    });

    it('deve calcular ~0.71 para 2 erros em 7 testes', () => {
      const metrics: ModelMetrics = {
        testsPassed: 5,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 1000,
        errorCount: 2,
        successRate: 71.4
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.stability).toBeCloseTo(0.71, 1);
    });

    it('deve calcular 0.0 para todos os testes com erro', () => {
      const metrics: ModelMetrics = {
        testsPassed: 0,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 1000,
        errorCount: 7,
        successRate: 0
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.scores.stability).toBe(0);
    });
  });

  describe('Badge Determination', () => {
    it('deve retornar PREMIUM para rating >= 4.8', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 1000,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.badge).toBe('PREMIUM');
    });

    it('deve retornar RECOMENDADO para rating 4.0-4.7', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 6000,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.badge).toBe('RECOMENDADO');
    });

    it('deve retornar FUNCIONAL para rating 3.0-3.9', () => {
      const metrics: ModelMetrics = {
        testsPassed: 5,
        totalTests: 7,
        averageRetries: 1,
        averageLatency: 3000,
        errorCount: 2,
        successRate: 71.4
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.badge).toBe('FUNCIONAL');
    });

    it('deve retornar LIMITADO para rating 2.0-2.9', () => {
      const metrics: ModelMetrics = {
        testsPassed: 3,
        totalTests: 7,
        averageRetries: 3,
        averageLatency: 7000,
        errorCount: 4,
        successRate: 42.9
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.badge).toBe('LIMITADO');
    });

    it('deve retornar NAO_RECOMENDADO para rating 1.0-1.9', () => {
      const metrics: ModelMetrics = {
        testsPassed: 2,
        totalTests: 7,
        averageRetries: 4,
        averageLatency: 12000,
        errorCount: 5,
        successRate: 28.6
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.badge).toBe('NAO_RECOMENDADO');
    });

    it('deve retornar INDISPONIVEL para rating < 1.0', () => {
      const metrics: ModelMetrics = {
        testsPassed: 0,
        totalTests: 7,
        averageRetries: 6,
        averageLatency: 15000,
        errorCount: 7,
        successRate: 0
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.badge).toBe('INDISPONIVEL');
    });
  });

  describe('Rating Normalization', () => {
    it('deve normalizar rating para escala 0-5', () => {
      const metrics: ModelMetrics = {
        testsPassed: 7,
        totalTests: 7,
        averageRetries: 0,
        averageLatency: 1000,
        errorCount: 0,
        successRate: 100
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.rating).toBeGreaterThanOrEqual(0);
      expect(result.rating).toBeLessThanOrEqual(5.0);
    });

    it('deve arredondar rating para 1 casa decimal', () => {
      const metrics: ModelMetrics = {
        testsPassed: 5,
        totalTests: 7,
        averageRetries: 1,
        averageLatency: 3500,
        errorCount: 2,
        successRate: 71.4
      };

      const result = calculator.calculateRating('test', metrics);
      expect(result.rating.toString()).toMatch(/^\d+\.\d$/);
    });
  });
});
