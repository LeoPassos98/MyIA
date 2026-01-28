// frontend/src/components/ModelRating/ModelBadge.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { memo } from 'react';
import { ModelBadge as ModelBadgeType } from '../../types/model-rating';
import { getBadgeColor, getBadgeEmoji, getBadgeDescription, getBadgeClassName } from '../../utils/rating-helpers';
import { OptimizedTooltip } from '../OptimizedTooltip';
import './ModelRating.css';

export interface ModelBadgeProps {
  /** Tipo do badge */
  badge: ModelBadgeType;
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Mostrar emoji */
  showIcon?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Badge colorido que representa a qualidade do modelo
 * 
 * ✅ Características:
 * - Cores específicas por badge (dourado, verde, amarelo, etc)
 * - 3 tamanhos: sm, md, lg
 * - Emoji opcional
 * - Tooltip com descrição ao passar o mouse
 * - Acessibilidade com ARIA labels
 * 
 * @example
 * <ModelBadge badge="PREMIUM" size="md" showIcon />
 * // Renderiza: 🏆 PREMIUM (com cor dourada)
 */
export const ModelBadge = memo(({
  badge,
  size = 'md',
  showIcon = true,
  className = ''
}: ModelBadgeProps) => {
  const color = getBadgeColor(badge);
  const emoji = getBadgeEmoji(badge);
  const description = getBadgeDescription(badge);
  const badgeClass = getBadgeClassName(badge);

  const badgeContent = (
    <span
      className={`model-badge model-badge--${size} ${badgeClass} ${className}`}
      style={{
        backgroundColor: `${color}15`, // 15 = ~8% opacity
        borderColor: color,
        color: color
      }}
      role="status"
      aria-label={description}
    >
      {showIcon && (
        <span className="model-badge__icon" aria-hidden="true">
          {emoji}
        </span>
      )}
      <span className="model-badge__text">
        {badge.replace('_', ' ')}
      </span>
    </span>
  );

  return (
    <OptimizedTooltip content={description} placement="top" delay={200}>
      {badgeContent}
    </OptimizedTooltip>
  );
});

ModelBadge.displayName = 'ModelBadge';
