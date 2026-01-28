// frontend/src/types/model-rating.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

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
  lastUpdated: string;      // ISO date string
}

/**
 * Modelo com informações de rating
 * Estende o modelo básico com dados de certificação e rating
 */
export interface ModelWithRating {
  id: string;
  name: string;
  provider: string;
  isAvailable: boolean;
  
  // Campos de rating (opcionais pois nem todos os modelos têm rating)
  rating?: number;              // 0-5.0
  badge?: ModelBadge;
  metrics?: ModelMetrics;
  scores?: ModelScores;
  ratingUpdatedAt?: string;     // ISO date
  
  // Outros campos existentes
  capabilities?: string[];
  contextWindow?: number;
  apiModelId?: string;
}

/**
 * Filtros para lista de modelos
 */
export interface ModelFilters {
  minRating?: number;          // 0-5
  badges?: ModelBadge[];       // ['PREMIUM', 'RECOMENDADO']
  sortBy?: 'rating' | 'name' | 'latency';
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string;
}

/**
 * Estatísticas de rating para dashboard
 */
export interface RatingStatistics {
  totalCertified: number;
  averageRating: number;
  premiumCount: number;
  distributionByBadge: Record<ModelBadge, number>;
  topModels: ModelWithRating[];
}
