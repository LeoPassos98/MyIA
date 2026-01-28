// backend/src/types/model-rating.ts
// Standards: docs/STANDARDS.md

/**
 * Badge visual que representa a qualidade do modelo
 * Baseado no rating de 0-5 estrelas
 */
export type ModelBadge = 
  | 'PREMIUM'           // 5.0 - Perfeito
  | 'RECOMENDADO'       // 4.0-4.9 - Ótimo
  | 'FUNCIONAL'         // 3.0-3.9 - Bom
  | 'LIMITADO'          // 2.0-2.9 - Regular
  | 'NAO_RECOMENDADO'   // 1.0-1.9 - Ruim
  | 'INDISPONIVEL';     // 0.0-0.9 - Crítico

/**
 * Métricas coletadas durante os testes de certificação
 */
export interface ModelMetrics {
  successRate: number;        // 0-100 (%)
  averageRetries: number;     // 0-6
  averageLatency: number;     // ms
  errorCount: number;         // 0-totalTests
  totalTests: number;         // 7 (padrão)
  testsPassed: number;        // 0-7
}

/**
 * Scores individuais que compõem o rating final
 * Cada score contribui com um peso específico para o rating total
 */
export interface ModelScores {
  success: number;      // 0-4.0 (40% do rating)
  resilience: number;   // 0-1.0 (20% do rating)
  performance: number;  // 0-1.0 (20% do rating)
  stability: number;    // 0-1.0 (20% do rating)
}

/**
 * Rating completo de um modelo
 * Inclui o rating numérico, badge visual, métricas e scores detalhados
 */
export interface ModelRating {
  modelId: string;
  rating: number;           // 0-5.0
  badge: ModelBadge;
  metrics: ModelMetrics;
  scores: ModelScores;
  lastUpdated: Date;
}
