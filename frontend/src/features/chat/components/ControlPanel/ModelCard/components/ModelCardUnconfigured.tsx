// frontend/src/features/chat/components/ControlPanel/ModelCard/components/ModelCardUnconfigured.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * ModelCardUnconfigured Component
 * 
 * Card de modelo sem providers configurados (edge case).
 * Exibe mensagem de aviso e desabilita interação.
 * 
 * @module features/chat/components/ControlPanel/ModelCard/components
 */

import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WarningIcon from '@mui/icons-material/Warning';
import type { ModelWithProviders } from '@/types/ai';

/**
 * Props do ModelCardUnconfigured
 */
export interface ModelCardUnconfiguredProps {
  /** Modelo a ser exibido */
  model: ModelWithProviders;
}

/**
 * Card de modelo sem providers configurados
 * 
 * Exibe um card desabilitado com mensagem de aviso quando o modelo
 * não possui nenhum provider configurado.
 * 
 * @example
 * ```tsx
 * <ModelCardUnconfigured model={model} />
 * ```
 */
export const ModelCardUnconfigured = React.memo(function ModelCardUnconfigured({
  model
}: ModelCardUnconfiguredProps) {
  
  return (
    <Card
      sx={{
        mb: 0.5,
        py: 1.75,
        px: 1,
        opacity: 0.6,
        pointerEvents: 'none',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'warning.main'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <SmartToyIcon fontSize="small" color="disabled" />
        <Typography variant="body2" color="text.secondary">
          {model.name}
        </Typography>
      </Box>
      
      <Typography
        variant="caption"
        color="warning.main"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}
      >
        <WarningIcon sx={{ fontSize: 14 }} />
        Este modelo não possui providers configurados. Configure AWS Bedrock ou Azure nas configurações.
      </Typography>
    </Card>
  );
});
