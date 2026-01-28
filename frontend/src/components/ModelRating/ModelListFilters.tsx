// frontend/src/components/ModelRating/ModelListFilters.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { memo, useState } from 'react';
import { ModelFilters, ModelBadge } from '../../types/model-rating';
import { getBadgeEmoji } from '../../utils/rating-helpers';
import './ModelRating.css';

export interface ModelListFiltersProps {
  /** Callback quando filtros mudam */
  onFilterChange: (filters: ModelFilters) => void;
  /** Filtros atuais */
  currentFilters: ModelFilters;
  /** Número total de modelos (antes do filtro) */
  totalModels?: number;
  /** Número de modelos após filtro */
  filteredCount?: number;
}

const BADGE_OPTIONS: ModelBadge[] = [
  'PREMIUM',
  'RECOMENDADO',
  'FUNCIONAL',
  'LIMITADO',
  'NAO_RECOMENDADO',
  'INDISPONIVEL'
];

/**
 * Componente de filtros e ordenação para lista de modelos
 * 
 * ✅ Características:
 * - Filtro por rating mínimo (slider 0-5)
 * - Filtro por badges (checkboxes múltiplos)
 * - Ordenação por rating, nome ou latência
 * - Botão "Limpar filtros"
 * - Contador de modelos filtrados
 * - Responsivo e acessível
 * 
 * @example
 * <ModelListFilters 
 *   onFilterChange={setFilters} 
 *   currentFilters={filters}
 *   totalModels={42}
 *   filteredCount={15}
 * />
 */
export const ModelListFilters = memo(({
  onFilterChange,
  currentFilters,
  totalModels = 0,
  filteredCount = 0
}: ModelListFiltersProps) => {
  const [minRating, setMinRating] = useState(currentFilters.minRating || 0);
  const [selectedBadges, setSelectedBadges] = useState<ModelBadge[]>(currentFilters.badges || []);
  const [sortBy, setSortBy] = useState(currentFilters.sortBy || 'rating');
  const [sortOrder, setSortOrder] = useState(currentFilters.sortOrder || 'desc');

  const hasActiveFilters = 
    minRating > 0 || 
    selectedBadges.length > 0 || 
    sortBy !== 'rating' || 
    sortOrder !== 'desc';

  const handleMinRatingChange = (value: number) => {
    setMinRating(value);
    onFilterChange({
      ...currentFilters,
      minRating: value > 0 ? value : undefined
    });
  };

  const handleBadgeToggle = (badge: ModelBadge) => {
    const newBadges = selectedBadges.includes(badge)
      ? selectedBadges.filter(b => b !== badge)
      : [...selectedBadges, badge];
    
    setSelectedBadges(newBadges);
    onFilterChange({
      ...currentFilters,
      badges: newBadges.length > 0 ? newBadges : undefined
    });
  };

  const handleSortByChange = (value: 'rating' | 'name' | 'latency') => {
    setSortBy(value);
    onFilterChange({
      ...currentFilters,
      sortBy: value
    });
  };

  const handleSortOrderChange = (value: 'asc' | 'desc') => {
    setSortOrder(value);
    onFilterChange({
      ...currentFilters,
      sortOrder: value
    });
  };

  const handleClearFilters = () => {
    setMinRating(0);
    setSelectedBadges([]);
    setSortBy('rating');
    setSortOrder('desc');
    onFilterChange({
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="model-list-filters">
      <div className="model-list-filters__header">
        <h3 className="model-list-filters__title">Filtros e Ordenação</h3>
        <button
          className="model-list-filters__clear"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          aria-label="Limpar todos os filtros"
        >
          Limpar filtros
        </button>
      </div>

      <div className="model-list-filters__content">
        {/* Filtro por rating mínimo */}
        <div className="model-list-filters__group">
          <label className="model-list-filters__label" htmlFor="min-rating-slider">
            Rating Mínimo: {minRating.toFixed(1)} ⭐
          </label>
          <input
            id="min-rating-slider"
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={minRating}
            onChange={(e) => handleMinRatingChange(parseFloat(e.target.value))}
            className="model-list-filters__rating-slider"
            aria-label={`Rating mínimo: ${minRating} estrelas`}
          />
        </div>

        {/* Filtro por badges */}
        <div className="model-list-filters__group">
          <label className="model-list-filters__label">
            Filtrar por Badge:
          </label>
          <div className="model-list-filters__badges" role="group" aria-label="Filtros de badge">
            {BADGE_OPTIONS.map((badge) => {
              const isActive = selectedBadges.includes(badge);
              const emoji = getBadgeEmoji(badge);
              
              return (
                <label
                  key={badge}
                  className={`model-list-filters__badge-checkbox ${
                    isActive ? 'model-list-filters__badge-checkbox--active' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => handleBadgeToggle(badge)}
                    style={{ display: 'none' }}
                    aria-label={`Filtrar por ${badge}`}
                  />
                  <span>{emoji}</span>
                  <span>{badge.replace('_', ' ')}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Ordenação */}
        <div className="model-list-filters__group">
          <label className="model-list-filters__label" htmlFor="sort-by-select">
            Ordenar por:
          </label>
          <div className="model-list-filters__sort">
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => handleSortByChange(e.target.value as 'rating' | 'name' | 'latency')}
              className="model-list-filters__sort-select"
              aria-label="Critério de ordenação"
            >
              <option value="rating">Rating</option>
              <option value="name">Nome</option>
              <option value="latency">Latência</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => handleSortOrderChange(e.target.value as 'asc' | 'desc')}
              className="model-list-filters__sort-select"
              aria-label="Ordem de ordenação"
            >
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      {totalModels > 0 && (
        <div className="model-list-filters__results" role="status" aria-live="polite">
          Exibindo {filteredCount} de {totalModels} modelos
        </div>
      )}
    </div>
  );
});

ModelListFilters.displayName = 'ModelListFilters';
