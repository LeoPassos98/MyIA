// frontend/src/components/ModelRating/ModelRatingStars.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { memo } from 'react';
import { getStarFillPercentage, roundRating } from '../../utils/rating-helpers';
import './ModelRating.css';

export interface ModelRatingStarsProps {
  /** Rating de 0 a 5 */
  rating: number;
  /** Tamanho das estrelas */
  size?: 'sm' | 'md' | 'lg';
  /** Mostrar valor numérico ao lado */
  showValue?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente de estrelas visuais para exibir rating de modelos
 * 
 * ✅ Características:
 * - Suporta estrelas parciais (ex: 4.3 = 4 estrelas cheias + 1 estrela 30% cheia)
 * - 3 tamanhos: sm (16px), md (20px), lg (24px)
 * - Opção de mostrar valor numérico
 * - Acessibilidade com ARIA labels
 * - Animação suave ao carregar
 * 
 * @example
 * <ModelRatingStars rating={4.3} size="md" showValue />
 * // Renderiza: ⭐⭐⭐⭐⭐ 4.3
 */
export const ModelRatingStars = memo(({
  rating,
  size = 'md',
  showValue = false,
  className = ''
}: ModelRatingStarsProps) => {
  const roundedRating = roundRating(rating);
  const stars = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div 
      className={`model-rating-stars model-rating-stars--${size} ${className}`}
      role="img"
      aria-label={`Rating: ${roundedRating} de 5 estrelas`}
    >
      <div className="model-rating-stars__container">
        {stars.map((starIndex) => {
          const fillPercentage = getStarFillPercentage(rating, starIndex);
          
          return (
            <div 
              key={starIndex} 
              className="model-rating-stars__star"
              aria-hidden="true"
            >
              {/* Estrela vazia (background) */}
              <svg
                className="model-rating-stars__star-empty"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="currentColor"
                />
              </svg>

              {/* Estrela preenchida (overlay com clip-path) */}
              {fillPercentage > 0 && (
                <svg
                  className="model-rating-stars__star-filled"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`
                  }}
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {showValue && (
        <span className="model-rating-stars__value" aria-hidden="true">
          {roundedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
});

ModelRatingStars.displayName = 'ModelRatingStars';
