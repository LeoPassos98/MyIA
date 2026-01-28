// frontend/src/components/ModelRating/ModelRatingDashboard.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { memo, useMemo } from 'react';
import { ModelWithRating } from '../../types/model-rating';
import { calculateRatingStatistics } from '../../utils/rating-helpers';
import { ModelRatingStars } from './ModelRatingStars';
import { ModelBadge } from './ModelBadge';
import './ModelRating.css';

export interface ModelRatingDashboardProps {
  /** Lista de modelos com rating */
  models: ModelWithRating[];
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Dashboard com visão geral dos ratings de todos os modelos
 * 
 * ✅ Características:
 * - Estatísticas gerais (total certificados, rating médio, modelos premium)
 * - Distribuição por badge
 * - Top 5 modelos por rating
 * - Gráficos visuais
 * - Responsivo e acessível
 * 
 * @example
 * <ModelRatingDashboard models={modelsWithRating} />
 */
export const ModelRatingDashboard = memo(({
  models,
  className = ''
}: ModelRatingDashboardProps) => {
  const stats = useMemo(() => calculateRatingStatistics(models), [models]);

  return (
    <div className={`model-rating-dashboard ${className}`}>
      {/* Header */}
      <div className="model-rating-dashboard__header">
        <span className="model-rating-dashboard__icon" aria-hidden="true">📊</span>
        <h2 className="model-rating-dashboard__title">Dashboard de Ratings</h2>
      </div>

      {/* Estatísticas principais */}
      <div className="model-rating-dashboard__stats">
        <div className="model-rating-dashboard__stat">
          <div className="model-rating-dashboard__stat-label">
            Total Certificados
          </div>
          <div className="model-rating-dashboard__stat-value">
            {stats.totalCertified}
          </div>
        </div>

        <div className="model-rating-dashboard__stat">
          <div className="model-rating-dashboard__stat-label">
            Rating Médio
          </div>
          <div className="model-rating-dashboard__stat-value">
            <ModelRatingStars rating={stats.averageRating} size="sm" showValue />
          </div>
        </div>

        <div className="model-rating-dashboard__stat">
          <div className="model-rating-dashboard__stat-label">
            Modelos Premium
          </div>
          <div className="model-rating-dashboard__stat-value">
            {stats.premiumCount}
            {stats.totalCertified > 0 && (
              <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#6B7280' }}>
                ({Math.round((stats.premiumCount / stats.totalCertified) * 100)}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Distribuição por badge */}
      {Object.keys(stats.distributionByBadge).length > 0 && (
        <div className="model-rating-dashboard__distribution">
          <h3 className="model-rating-dashboard__section-title">
            📈 Distribuição por Badge
          </h3>
          <div className="model-rating-dashboard__badge-distribution">
            {Object.entries(stats.distributionByBadge).map(([badge, count]) => (
              <div key={badge} className="model-rating-dashboard__badge-item">
                <ModelBadge 
                  badge={badge as any} 
                  size="sm" 
                  showIcon 
                />
                <span className="model-rating-dashboard__badge-count">
                  {count} modelo{count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 5 modelos */}
      {stats.topModels.length > 0 && (
        <div className="model-rating-dashboard__top-models">
          <h3 className="model-rating-dashboard__section-title">
            🏆 Top {Math.min(5, stats.topModels.length)} Modelos
          </h3>
          <div className="model-rating-dashboard__model-list">
            {stats.topModels.map((model, index) => (
              <div key={model.id} className="model-rating-dashboard__model-item">
                <div className="model-rating-dashboard__model-rank">
                  {index + 1}
                </div>
                <div className="model-rating-dashboard__model-info">
                  <div className="model-rating-dashboard__model-name">
                    {model.name}
                  </div>
                  <div className="model-rating-dashboard__model-provider">
                    {model.provider}
                  </div>
                </div>
                <div className="model-rating-dashboard__model-rating">
                  {model.badge && (
                    <ModelBadge badge={model.badge} size="sm" showIcon={false} />
                  )}
                  <ModelRatingStars 
                    rating={model.rating || 0} 
                    size="sm" 
                    showValue 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há modelos certificados */}
      {stats.totalCertified === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px 24px', 
          color: '#6B7280' 
        }}>
          <p style={{ fontSize: '1.125rem', marginBottom: '8px' }}>
            Nenhum modelo certificado ainda
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Execute a certificação de modelos para ver as estatísticas aqui
          </p>
        </div>
      )}
    </div>
  );
});

ModelRatingDashboard.displayName = 'ModelRatingDashboard';
