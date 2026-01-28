// frontend/src/components/ModelRating/ModelMetricsTooltip.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { memo, ReactNode } from 'react';
import { ModelMetrics, ModelScores } from '../../types/model-rating';
import { formatLatency, formatSuccessRate, formatRetries } from '../../utils/rating-helpers';
import { OptimizedTooltip } from '../OptimizedTooltip';
import './ModelRating.css';

export interface ModelMetricsTooltipProps {
  /** Métricas do modelo */
  metrics: ModelMetrics;
  /** Scores individuais */
  scores: ModelScores;
  /** Elemento que dispara o tooltip */
  children: ReactNode;
}

/**
 * Tooltip detalhado com métricas e scores do modelo
 * 
 * ✅ Características:
 * - Exibe todas as métricas formatadas
 * - Mostra scores individuais com barras de progresso
 * - Indica peso de cada score no rating final
 * - Animação suave ao aparecer
 * - Acessibilidade completa
 * 
 * @example
 * <ModelMetricsTooltip metrics={model.metrics} scores={model.scores}>
 *   <ModelRatingStars rating={model.rating} />
 * </ModelMetricsTooltip>
 */
export const ModelMetricsTooltip = memo(({
  metrics,
  scores,
  children
}: ModelMetricsTooltipProps) => {
  const tooltipContent = (
    <div className="model-metrics-tooltip">
      {/* Métricas principais */}
      <div className="model-metrics-tooltip__section">
        <h4 className="model-metrics-tooltip__title">Métricas de Certificação</h4>
        <div className="model-metrics-tooltip__metrics">
          <div className="model-metrics-tooltip__metric">
            <span className="model-metrics-tooltip__metric-label">Taxa de Sucesso:</span>
            <span className="model-metrics-tooltip__metric-value">
              {formatSuccessRate(metrics.successRate)} ({metrics.testsPassed}/{metrics.totalTests} testes)
            </span>
          </div>
          <div className="model-metrics-tooltip__metric">
            <span className="model-metrics-tooltip__metric-label">Retries Médios:</span>
            <span className="model-metrics-tooltip__metric-value">
              {formatRetries(metrics.averageRetries)}
            </span>
          </div>
          <div className="model-metrics-tooltip__metric">
            <span className="model-metrics-tooltip__metric-label">Latência Média:</span>
            <span className="model-metrics-tooltip__metric-value">
              {formatLatency(metrics.averageLatency)}
            </span>
          </div>
          <div className="model-metrics-tooltip__metric">
            <span className="model-metrics-tooltip__metric-label">Erros:</span>
            <span className="model-metrics-tooltip__metric-value">
              {metrics.errorCount}
            </span>
          </div>
        </div>
      </div>

      {/* Scores individuais */}
      <div className="model-metrics-tooltip__section">
        <h4 className="model-metrics-tooltip__title">Scores Individuais</h4>
        <div className="model-metrics-tooltip__scores">
          <ScoreBar
            label="Success"
            score={scores.success}
            maxScore={4.0}
            weight={40}
          />
          <ScoreBar
            label="Resilience"
            score={scores.resilience}
            maxScore={1.0}
            weight={20}
          />
          <ScoreBar
            label="Performance"
            score={scores.performance}
            maxScore={1.0}
            weight={20}
          />
          <ScoreBar
            label="Stability"
            score={scores.stability}
            maxScore={1.0}
            weight={20}
          />
        </div>
      </div>
    </div>
  );

  return (
    <OptimizedTooltip content={tooltipContent} placement="top" delay={300}>
      {children}
    </OptimizedTooltip>
  );
});

ModelMetricsTooltip.displayName = 'ModelMetricsTooltip';

/**
 * Componente auxiliar para exibir barra de progresso de um score
 */
interface ScoreBarProps {
  label: string;
  score: number;
  maxScore: number;
  weight: number;
}

const ScoreBar = memo(({ label, score, maxScore, weight }: ScoreBarProps) => {
  const percentage = (score / maxScore) * 100;
  
  return (
    <div className="model-metrics-tooltip__score">
      <div className="model-metrics-tooltip__score-header">
        <span className="model-metrics-tooltip__score-label">
          {label} ({weight}%)
        </span>
        <span className="model-metrics-tooltip__score-value">
          {score.toFixed(1)}/{maxScore.toFixed(1)}
        </span>
      </div>
      <div className="model-metrics-tooltip__score-bar">
        <div
          className="model-metrics-tooltip__score-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={maxScore}
          aria-label={`${label}: ${score} de ${maxScore}`}
        />
      </div>
    </div>
  );
});

ScoreBar.displayName = 'ScoreBar';
