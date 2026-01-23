// frontend/src/constants/uiConstants.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Larguras e dimensões padrão da UI
 */
export const UI_DIMENSIONS = {
  tooltipMaxWidth: 320,
  iconButtonSize: 48,
  chipHeight: 20,
} as const;

/**
 * Durações de animações (em segundos)
 */
export const ANIMATION_DURATIONS = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
} as const;

/**
 * Keyframes de animações comuns
 */
export const KEYFRAMES = {
  fadeIn: {
    from: { opacity: 0, transform: 'translateY(4px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
} as const;
