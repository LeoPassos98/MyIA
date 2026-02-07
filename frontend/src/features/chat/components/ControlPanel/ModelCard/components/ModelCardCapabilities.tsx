// frontend/src/features/chat/components/ControlPanel/ModelCard/components/ModelCardCapabilities.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * ModelCardCapabilities Component
 * 
 * Badges de capabilities do modelo:
 * - Vision
 * - Prompt Cache
 * - Function Calling
 * 
 * @module features/chat/components/ControlPanel/ModelCard/components
 */

import React from 'react';
import { Box } from '@mui/material';
import { CapabilityBadge } from '../../CapabilityBadge';
import type { ModelWithProviders } from '@/types/ai';

/**
 * Props do ModelCardCapabilities
 */
export interface ModelCardCapabilitiesProps {
  /** Modelo a ser exibido */
  model: ModelWithProviders;
}

/**
 * Badges de capabilities do modelo
 * 
 * Exibe badges para capabilities suportadas:
 * - Vision: Suporte a imagens
 * - Cache: Suporte a prompt caching
 * - Functions: Suporte a function calling
 * 
 * Retorna null se o modelo não tiver capabilities definidas.
 * 
 * @example
 * ```tsx
 * <ModelCardCapabilities model={model} />
 * ```
 */
export const ModelCardCapabilities = React.memo(function ModelCardCapabilities({
  model
}: ModelCardCapabilitiesProps) {
  
  // Não renderiza se não houver capabilities
  if (!model.capabilities) {
    return null;
  }
  
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
      {/* Vision Support */}
      {model.capabilities.supportsVision && (
        <CapabilityBadge
          label="Vision"
          enabled={true}
          icon="vision"
          size="small"
        />
      )}
      
      {/* Prompt Cache Support */}
      {model.capabilities.supportsPromptCache && (
        <CapabilityBadge
          label="Cache"
          enabled={true}
          icon="check"
          size="small"
        />
      )}
      
      {/* Function Calling Support */}
      {model.capabilities.supportsFunctionCalling && (
        <CapabilityBadge
          label="Functions"
          enabled={true}
          icon="function"
          size="small"
        />
      )}
    </Box>
  );
});
