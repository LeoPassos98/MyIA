// frontend/src/features/chat/components/ControlPanel/ModelCard/components/ModelCardExpanded.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * ModelCardExpanded Component
 * 
 * Estado expandido do ModelCard.
 * Compõe: Header, Metrics e Capabilities.
 * 
 * @module features/chat/components/ControlPanel/ModelCard/components
 */

import React from 'react';
import { Box } from '@mui/material';
import { ModelCardHeader } from './ModelCardHeader';
import { ModelCardMetrics } from './ModelCardMetrics';
import { ModelCardCapabilities } from './ModelCardCapabilities';
import type { ModelWithProviders } from '@/types/ai';

/**
 * Props do ModelCardExpanded
 */
export interface ModelCardExpandedProps {
  /** Modelo a ser exibido */
  model: ModelWithProviders;
  /** Se o modelo está selecionado */
  isSelected: boolean;
  /** Se o card está desabilitado */
  disabled: boolean;
  /** Modelo com rating (pode ser null) */
  modelWithRating: any; // TODO: tipar corretamente
  /** Handler para clique no radio */
  handleRadioClick: (e: React.MouseEvent) => void;
}

/**
 * Estado expandido do ModelCard
 * 
 * Compõe os sub-componentes:
 * - ModelCardHeader: Radio, nome, versão, badges, rating, providers
 * - ModelCardMetrics: Context, output, pricing
 * - ModelCardCapabilities: Badges de capabilities (vision, cache, functions)
 * 
 * @example
 * ```tsx
 * <ModelCardExpanded
 *   model={model}
 *   isSelected={true}
 *   disabled={false}
 *   modelWithRating={ratingData}
 *   handleRadioClick={(e) => handleClick(e)}
 * />
 * ```
 */
export const ModelCardExpanded = React.memo(function ModelCardExpanded({
  model,
  isSelected,
  disabled,
  modelWithRating,
  handleRadioClick
}: ModelCardExpandedProps) {
  
  return (
    <Box>
      {/* Header: Radio + Nome + Versão + Badges + Rating + Providers */}
      <ModelCardHeader
        model={model}
        isSelected={isSelected}
        disabled={disabled}
        modelWithRating={modelWithRating}
        handleRadioClick={handleRadioClick}
      />
      
      {/* Metrics: Context + Output + Pricing */}
      <ModelCardMetrics model={model} />
      
      {/* Capabilities: Vision, Cache, Functions */}
      <ModelCardCapabilities model={model} />
    </Box>
  );
});
