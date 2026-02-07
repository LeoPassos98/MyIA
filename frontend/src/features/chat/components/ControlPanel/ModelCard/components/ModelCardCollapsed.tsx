// frontend/src/features/chat/components/ControlPanel/ModelCard/components/ModelCardCollapsed.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * ModelCardCollapsed Component
 * 
 * Renderização do estado colapsado do ModelCard.
 * Exibe apenas: Radio + Nome Resumido + Badge de Context.
 * 
 * @module features/chat/components/ControlPanel/ModelCard/components
 */

import React from 'react';
import { Box, Radio, Typography } from '@mui/material';
import { MetricBadge } from '@/components/Badges';
import { formatTokens } from '@/utils/formatters';
import { formatModelShortName } from '../utils/modelNameFormatter';
import type { ModelWithProviders } from '@/types/ai';

/**
 * Props do ModelCardCollapsed
 */
export interface ModelCardCollapsedProps {
  /** Modelo a ser exibido */
  model: ModelWithProviders;
  /** Se o modelo está selecionado */
  isSelected: boolean;
  /** Se o card está desabilitado */
  disabled: boolean;
  /** Handler para clique no radio */
  handleRadioClick: (e: React.MouseEvent) => void;
}

/**
 * Componente de estado colapsado do ModelCard
 * 
 * Exibe uma linha compacta com:
 * - Radio button para seleção
 * - Nome resumido do modelo (uppercase, sem versão)
 * - Badge de context window
 * 
 * @example
 * ```tsx
 * <ModelCardCollapsed
 *   model={model}
 *   isSelected={true}
 *   disabled={false}
 *   handleRadioClick={(e) => handleClick(e)}
 * />
 * ```
 */
export const ModelCardCollapsed = React.memo(function ModelCardCollapsed({
  model,
  isSelected,
  disabled,
  handleRadioClick
}: ModelCardCollapsedProps) {
  
  // Formata nome resumido
  const shortName = formatModelShortName(model.name);
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 32
      }}
    >
      {/* Radio Button */}
      <Radio
        checked={isSelected}
        disabled={disabled}
        sx={{ p: 0.5, flexShrink: 0 }}
        aria-label={`Selecionar ${model.name}`}
        onClick={handleRadioClick}
      />
      
      {/* Nome Resumido */}
      <Typography
        variant="caption"
        fontWeight={isSelected ? 800 : 600}
        color={isSelected ? 'primary.main' : 'text.primary'}
        sx={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0
        }}
      >
        {shortName}
      </Typography>
      
      {/* Badge de Context Window */}
      <MetricBadge
        label="Context"
        value={formatTokens(model.contextWindow)}
        size="small"
        color={isSelected ? 'primary' : 'default'}
      />
    </Box>
  );
});
