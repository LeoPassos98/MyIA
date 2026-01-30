// frontend/src/components/ModelRating/ModelBadge.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { memo } from 'react';
import { useTheme } from '@mui/material/styles';
import { ModelBadge as ModelBadgeType } from '../../types/model-rating';
import { getBadgeColor, getBadgeIcon, getBadgeDescription, getBadgeClassName } from '../../utils/rating-helpers';
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
 * - Cores do theme (theme.palette.badges)
 * - 3 tamanhos: sm, md, lg
 * - Ícone MUI que se adapta à cor automaticamente
 * - Tooltip com descrição ao passar o mouse
 * - Acessibilidade com ARIA labels
 *
 * @example
 * <ModelBadge badge="PREMIUM" size="md" showIcon />
 * // Renderiza: [WorkspacePremiumIcon] PREMIUM (com cor dourada do theme)
 */
export const ModelBadge = memo(({
  badge,
  size = 'md',
  showIcon = true,
  className = ''
}: ModelBadgeProps) => {
  const theme = useTheme();
  const color = getBadgeColor(badge, theme);
  const IconComponent = getBadgeIcon(badge);
  const description = getBadgeDescription(badge);
  const badgeClass = getBadgeClassName(badge);

  // Opacidade do background vem do theme
  const bgOpacity = (theme.components as any)?.badge?.opacity || 0.15;
  const backgroundColor = `${color}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`;

  // Tamanhos de ícone baseados no size do badge
  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  };
  const iconSize = iconSizes[size];

  const badgeContent = (
    <span
      className={`model-badge model-badge--${size} ${badgeClass} ${className}`}
      style={{
        backgroundColor,
        borderColor: color,
        color: color
      }}
      role="status"
      aria-label={description}
    >
      {showIcon && (
        <span className="model-badge__icon" aria-hidden="true">
          <IconComponent sx={{ fontSize: iconSize, color: 'inherit' }} />
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
