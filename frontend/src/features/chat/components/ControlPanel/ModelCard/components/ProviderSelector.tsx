// frontend/src/features/chat/components/ControlPanel/ModelCard/components/ProviderSelector.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * ProviderSelector Component
 * 
 * Dropdown para seleção de provider quando o modelo está disponível em múltiplos providers.
 * Exibido apenas quando o modelo está selecionado e possui mais de um provider.
 * 
 * @module features/chat/components/ControlPanel/ModelCard/components
 */

import React from 'react';
import {
  Box,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import type { ModelWithProviders } from '@/types/ai';

/**
 * Props do ProviderSelector
 */
export interface ProviderSelectorProps {
  /** Modelo a ser exibido */
  model: ModelWithProviders;
  /** Provider atualmente selecionado */
  selectedProvider?: string;
  /** Callback ao trocar provider */
  onProviderChange?: (providerSlug: string) => void;
}

/**
 * Seletor de provider para modelos multi-provider
 * 
 * Exibe um dropdown com todos os providers disponíveis para o modelo.
 * Providers não configurados aparecem desabilitados com indicação visual.
 * 
 * @example
 * ```tsx
 * <ProviderSelector
 *   model={model}
 *   selectedProvider="aws"
 *   onProviderChange={(slug) => handleChange(slug)}
 * />
 * ```
 */
export const ProviderSelector = React.memo(function ProviderSelector({
  model,
  selectedProvider,
  onProviderChange
}: ProviderSelectorProps) {
  
  return (
    <>
      <Divider sx={{ my: 1.5 }} />
      
      <Box sx={{ p: 2, bgcolor: 'backgrounds.disabledSubtle', borderRadius: 1 }}>
        <FormControl fullWidth size="small">
          <InputLabel id={`provider-select-${model.id}`}>
            Provider Ativo
          </InputLabel>
          
          <Select
            labelId={`provider-select-${model.id}`}
            value={selectedProvider || model.availableOn[0]?.providerSlug || ''}
            label="Provider Ativo"
            onChange={(e) => {
              e.stopPropagation();
              onProviderChange?.(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {model.availableOn.map((provider) => (
              <MenuItem
                key={provider.providerSlug}
                value={provider.providerSlug}
                disabled={!provider.isConfigured}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{provider.providerName}</span>
                  {!provider.isConfigured && (
                    <Typography variant="caption" color="text.secondary">
                      (não configurado)
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 1,
            fontSize: '0.7rem'
          }}
        >
          <LightbulbIcon sx={{ fontSize: 12 }} />
          Este modelo está disponível em múltiplos providers. Selecione qual usar.
        </Typography>
      </Box>
    </>
  );
});
