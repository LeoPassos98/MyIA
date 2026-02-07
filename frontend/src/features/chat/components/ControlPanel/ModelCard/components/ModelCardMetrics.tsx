// frontend/src/features/chat/components/ControlPanel/ModelCard/components/ModelCardMetrics.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * ModelCardMetrics Component
 * 
 * Grid de métricas do modelo:
 * - Context window
 * - Max output tokens
 * - Input pricing
 * - Output pricing
 * - Cache pricing (se disponível)
 * 
 * @module features/chat/components/ControlPanel/ModelCard/components
 */

import React from 'react';
import { Grid, Typography } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import OutputIcon from '@mui/icons-material/Output';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaidIcon from '@mui/icons-material/Paid';
import StorageIcon from '@mui/icons-material/Storage';
import { formatTokens } from '@/utils/formatters';
import type { ModelWithProviders } from '@/types/ai';

/**
 * Props do ModelCardMetrics
 */
export interface ModelCardMetricsProps {
  /** Modelo a ser exibido */
  model: ModelWithProviders;
}

/**
 * Grid de métricas do modelo
 * 
 * Exibe em 2 colunas:
 * - Coluna 1: Context window e max output tokens
 * - Coluna 2: Pricing (input/output)
 * - Linha adicional: Cache pricing (se disponível)
 * 
 * @example
 * ```tsx
 * <ModelCardMetrics model={model} />
 * ```
 */
export const ModelCardMetrics = React.memo(function ModelCardMetrics({
  model
}: ModelCardMetricsProps) {
  
  return (
    <>
      {/* Grid Principal: Context/Output + Pricing */}
      <Grid container spacing={1.5} sx={{ mb: 1 }}>
        {/* Coluna 1: Context & Output */}
        <Grid item xs={6}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.7rem',
              mb: 0.5
            }}
          >
            <DescriptionIcon sx={{ fontSize: 12 }} />
            Context: {formatTokens(model.contextWindow)}
          </Typography>
          
          {model.maxOutputTokens && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.7rem'
              }}
            >
              <OutputIcon sx={{ fontSize: 12 }} />
              Output: {formatTokens(model.maxOutputTokens)}
            </Typography>
          )}
        </Grid>
        
        {/* Coluna 2: Pricing */}
        <Grid item xs={6}>
          {model.pricing && (
            <>
              {model.pricing.inputPer1M !== undefined && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.7rem',
                    mb: 0.5
                  }}
                >
                  <AttachMoneyIcon sx={{ fontSize: 12 }} />
                  In: ${model.pricing.inputPer1M.toFixed(2)}/1M
                </Typography>
              )}
              
              {model.pricing.outputPer1M !== undefined && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.7rem'
                  }}
                >
                  <PaidIcon sx={{ fontSize: 12 }} />
                  Out: ${model.pricing.outputPer1M.toFixed(2)}/1M
                </Typography>
              )}
            </>
          )}
        </Grid>
      </Grid>
      
      {/* Cache Pricing (linha adicional se disponível) */}
      {model.pricing?.cacheReadPer1M !== undefined && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 1,
            fontSize: '0.65rem'
          }}
        >
          <StorageIcon sx={{ fontSize: 12 }} />
          Cache: ${model.pricing.cacheReadPer1M.toFixed(2)}/1M read,{' '}
          ${model.pricing.cacheWritePer1M?.toFixed(2) || '0.00'}/1M write
        </Typography>
      )}
    </>
  );
});
