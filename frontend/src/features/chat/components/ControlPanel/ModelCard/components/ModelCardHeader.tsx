// frontend/src/features/chat/components/ControlPanel/ModelCard/components/ModelCardHeader.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * ModelCardHeader Component
 * 
 * Header do ModelCard expandido com:
 * - Radio button
 * - Nome completo do modelo
 * - Versão
 * - Badges (certificação, quality, etc)
 * - Rating com tooltip
 * - Badges de providers
 * 
 * @module features/chat/components/ControlPanel/ModelCard/components
 */

import React from 'react';
import { Box, Radio, Typography } from '@mui/material';
import { ModelRatingStars, ModelMetricsTooltip } from '@/components/ModelRating';
import { ModelBadgeGroup } from '@/components/ModelBadges';
import { ProviderBadgeGroup } from '../../ProviderBadge';
import type { ModelWithProviders } from '@/types/ai';

/**
 * Props do ModelCardHeader
 */
export interface ModelCardHeaderProps {
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
 * Header do ModelCard expandido
 * 
 * Exibe informações principais do modelo:
 * - Radio button para seleção
 * - Nome completo e versão
 * - Badges de status (certificação, quality warning, etc)
 * - Rating com tooltip de métricas
 * - Badges de providers disponíveis
 * 
 * @example
 * ```tsx
 * <ModelCardHeader
 *   model={model}
 *   isSelected={true}
 *   disabled={false}
 *   modelWithRating={ratingData}
 *   handleRadioClick={(e) => handleClick(e)}
 * />
 * ```
 */
export const ModelCardHeader = React.memo(function ModelCardHeader({
  model,
  isSelected,
  disabled,
  modelWithRating,
  handleRadioClick
}: ModelCardHeaderProps) {
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1.5 }}>
      {/* Radio Button */}
      <Radio
        checked={isSelected}
        disabled={disabled}
        sx={{ mt: -0.5, p: 0.5, flexShrink: 0 }}
        aria-label={`Selecionar ${model.name}`}
        onClick={handleRadioClick}
      />
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Nome Completo e Versão */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
          <Typography
            variant="caption"
            fontWeight={isSelected ? 800 : 800}
            color={isSelected ? 'primary.main' : 'text.primary'}
            sx={{
              fontSize: '0.95rem',
              wordBreak: 'break-word',
              flex: '1 1 auto',
              minWidth: 0
            }}
          >
            {model.name}
          </Typography>
          
          {/* Badge de Versão */}
          {model.version && (
            <Typography
              variant="caption"
              sx={{
                px: 0.75,
                py: 0.25,
                bgcolor: 'backgrounds.disabledSubtle',
                borderRadius: 0.5,
                fontWeight: 800,
                fontSize: '0.65rem',
                flexShrink: 0
              }}
            >
              v{model.version}
            </Typography>
          )}
          
          {/* Badges de Status (Certificação, Quality Warning, etc) */}
          <ModelBadgeGroup
            model={{ apiModelId: model.apiModelId }}
            size="sm"
            spacing={0.5}
          />
        </Box>
        
        {/* Rating com Tooltip */}
        {modelWithRating?.rating && (
          <Box sx={{ mb: 1 }}>
            <ModelMetricsTooltip
              metrics={modelWithRating.metrics!}
              scores={modelWithRating.scores!}
            >
              <ModelRatingStars
                rating={modelWithRating.rating}
                size="sm"
                showValue
              />
            </ModelMetricsTooltip>
          </Box>
        )}
        
        {/* Badges de Providers */}
        <Box sx={{ mb: 1.5 }}>
          <ProviderBadgeGroup
            providers={model.availableOn}
            modelId={model.apiModelId}
            showCertification
            size="small"
          />
        </Box>
      </Box>
    </Box>
  );
});
