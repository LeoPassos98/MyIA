// backend/src/services/ai/rating/rating-calculator.ts
// Standards: docs/STANDARDS.md

import { ModelBadge, ModelMetrics, ModelScores, ModelRating } from '../../../types/model-rating';
import { logger } from '../../../utils/logger';

/**
 * Calculadora de Rating de Modelos
 * 
 * Implementa um sistema de classificação 0-5 estrelas baseado em múltiplas métricas:
 * - Success Score (40%): Taxa de sucesso dos testes
 * - Resilience Score (20%): Capacidade de recuperação (retries)
 * - Performance Score (20%): Latência das respostas
 * - Stability Score (20%): Estabilidade (ausência de erros)
 * 
 * Fórmula Final:
 * rating = (successScore * 0.40 + resilienceScore * 0.20 + 
 *           performanceScore * 0.20 + stabilityScore * 0.20) * 5.0 / 4.0
 */
export class RatingCalculator {
  /**
   * Calcula o rating completo de um modelo baseado nas métricas coletadas
   * 
   * @param modelId - ID do modelo sendo avaliado
   * @param metrics - Métricas coletadas durante os testes
   * @returns Rating completo com scores detalhados e badge
   */
  calculateRating(modelId: string, metrics: ModelMetrics): ModelRating {
    logger.debug('[RatingCalculator] Calculando rating', {
      modelId,
      metrics
    });

    // Calcular scores individuais
    const successScore = this.calculateSuccessScore(metrics);
    const resilienceScore = this.calculateResilienceScore(metrics);
    const performanceScore = this.calculatePerformanceScore(metrics);
    const stabilityScore = this.calculateStabilityScore(metrics);

    const scores: ModelScores = {
      success: successScore,
      resilience: resilienceScore,
      performance: performanceScore,
      stability: stabilityScore
    };

    // Calcular rating final (0-5.0)
    // Fórmula: soma ponderada já normalizada para escala 0-5
    // successScore contribui com até 4.0 (40% de 5.0 = 2.0)
    // Outros scores contribuem com até 1.0 cada (20% de 5.0 = 1.0 cada)
    // Total máximo: 2.0 + 1.0 + 1.0 + 1.0 = 5.0
    const rawRating = (
      successScore * 0.50 +      // 40% do rating final (max 2.0)
      resilienceScore * 1.0 +    // 20% do rating final (max 1.0)
      performanceScore * 1.0 +   // 20% do rating final (max 1.0)
      stabilityScore * 1.0       // 20% do rating final (max 1.0)
    );

    // Arredondar para 1 casa decimal
    const rating = Number(rawRating.toFixed(1));

    // Determinar badge baseado no rating
    const badge = this.determineBadge(rating);

    logger.info('[RatingCalculator] Rating calculado', {
      modelId,
      rating,
      badge,
      scores
    });

    return {
      modelId,
      rating,
      badge,
      metrics,
      scores,
      lastUpdated: new Date()
    };
  }

  /**
   * Calcula Success Score (0-4.0)
   * 
   * Representa a taxa de sucesso dos testes.
   * É o componente mais importante (40% do rating).
   * 
   * Fórmula: (testsPassed / totalTests) * 4.0
   * 
   * Exemplos:
   * - 7/7 testes passaram = 4.0
   * - 5/7 testes passaram = 2.86
   * - 0/7 testes passaram = 0.0
   */
  private calculateSuccessScore(metrics: ModelMetrics): number {
    if (metrics.totalTests === 0) {
      logger.warn('[RatingCalculator] Total de testes é zero');
      return 0;
    }

    const score = (metrics.testsPassed / metrics.totalTests) * 4.0;
    return Number(score.toFixed(2));
  }

  /**
   * Calcula Resilience Score (0-1.0)
   *
   * Representa a capacidade do modelo de se recuperar de falhas temporárias.
   * Penaliza modelos que precisam de muitos retries.
   *
   * Fórmula: max(0.5, 1.0 - (min(averageRetries, 6) / 6) * 0.5)
   *
   * Lógica:
   * - 0 retries = 1.0 (perfeito)
   * - 3 retries = 0.75 (bom)
   * - 6+ retries = 0.5 (mínimo aceitável)
   *
   * Exemplos:
   * - 0 retries médios = 1.0
   * - 2 retries médios = 0.83
   * - 6 retries médios = 0.5
   * - 10 retries médios = 0.5 (limitado ao mínimo)
   */
  private calculateResilienceScore(metrics: ModelMetrics): number {
    const maxRetries = 6;
    // Limitar retries ao máximo de 6 para cálculo
    const cappedRetries = Math.min(metrics.averageRetries, maxRetries);
    const score = Math.max(0.5, 1.0 - (cappedRetries / maxRetries) * 0.5);
    return Number(score.toFixed(2));
  }

  /**
   * Calcula Performance Score (0-1.0)
   * 
   * Representa a velocidade de resposta do modelo.
   * Baseado em thresholds de latência.
   * 
   * Thresholds:
   * - < 2000ms = 1.0 (rápido)
   * - < 5000ms = 0.7 (aceitável)
   * - < 10000ms = 0.4 (lento)
   * - >= 10000ms = 0.2 (muito lento)
   * 
   * Exemplos:
   * - 1285ms = 1.0 (Amazon Nova Micro)
   * - 5963ms = 0.7 (Claude 3 Sonnet)
   * - 12000ms = 0.2 (muito lento)
   */
  private calculatePerformanceScore(metrics: ModelMetrics): number {
    const latency = metrics.averageLatency;

    if (latency < 2000) return 1.0;      // Rápido
    if (latency < 5000) return 0.7;      // Aceitável
    if (latency < 10000) return 0.4;     // Lento
    return 0.2;                          // Muito lento
  }

  /**
   * Calcula Stability Score (0-1.0)
   * 
   * Representa a estabilidade do modelo (ausência de erros).
   * Penaliza modelos com alta taxa de erros.
   * 
   * Fórmula: max(0, 1.0 - (errorCount / totalTests))
   * 
   * Exemplos:
   * - 0 erros = 1.0 (perfeito)
   * - 2 erros em 7 testes = 0.71
   * - 7 erros em 7 testes = 0.0 (crítico)
   */
  private calculateStabilityScore(metrics: ModelMetrics): number {
    if (metrics.totalTests === 0) {
      logger.warn('[RatingCalculator] Total de testes é zero');
      return 0;
    }

    const score = Math.max(0, 1.0 - (metrics.errorCount / metrics.totalTests));
    return Number(score.toFixed(2));
  }

  /**
   * Determina o badge visual baseado no rating numérico
   * 
   * Thresholds:
   * - >= 4.8 = PREMIUM (5.0 estrelas)
   * - >= 4.0 = RECOMENDADO (4.0-4.9 estrelas)
   * - >= 3.0 = FUNCIONAL (3.0-3.9 estrelas)
   * - >= 2.0 = LIMITADO (2.0-2.9 estrelas)
   * - >= 1.0 = NAO_RECOMENDADO (1.0-1.9 estrelas)
   * - < 1.0 = INDISPONIVEL (0.0-0.9 estrelas)
   * 
   * @param rating - Rating numérico (0-5.0)
   * @returns Badge correspondente
   */
  private determineBadge(rating: number): ModelBadge {
    if (rating >= 4.8) return 'PREMIUM';
    if (rating >= 4.0) return 'RECOMENDADO';
    if (rating >= 3.0) return 'FUNCIONAL';
    if (rating >= 2.0) return 'LIMITADO';
    if (rating >= 1.0) return 'NAO_RECOMENDADO';
    return 'INDISPONIVEL';
  }
}
