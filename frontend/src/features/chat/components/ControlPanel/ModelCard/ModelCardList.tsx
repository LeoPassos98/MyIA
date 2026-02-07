// frontend/src/features/chat/components/ControlPanel/ModelCard/ModelCardList.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * ModelCardList Component
 * 
 * Lista de ModelCards com título, contador e empty state.
 * 
 * @module features/chat/components/ControlPanel/ModelCard
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { ModelCard } from './ModelCard';
import type { ModelWithProviders } from '@/types/ai';

/**
 * Props do componente ModelCardList
 */
export interface ModelCardListProps {
  /** Lista de modelos a serem exibidos */
  models: ModelWithProviders[];
  /** Modelo atualmente selecionado */
  selectedModel: ModelWithProviders | null;
  /** Callback ao selecionar modelo */
  onSelectModel: (modelId: string) => void;
  /** Provider ativo se modelo selecionado */
  selectedProvider?: string;
  /** Callback ao trocar provider */
  onProviderChange?: (providerSlug: string) => void;
  /** Se a lista está desabilitada */
  disabled?: boolean;
  /** ID do modelo expandido (accordion exclusivo) */
  expandedModelId?: string | null;
  /** Callback ao alternar expansão */
  onToggleExpand?: (modelId: string) => void;
}

/**
 * Lista de ModelCards
 * 
 * Exibe uma lista de modelos em formato de cards, com título e contador.
 * Mostra mensagem quando não há modelos disponíveis.
 * 
 * @example
 * ```tsx
 * <ModelCardList
 *   models={filteredModels}
 *   selectedModel={selectedModel}
 *   onSelectModel={(id) => handleSelectModel(id)}
 *   selectedProvider="aws"
 *   onProviderChange={(provider) => handleProviderChange(provider)}
 * />
 * ```
 */
export const ModelCardList = React.memo(function ModelCardList({
  models,
  selectedModel,
  onSelectModel,
  selectedProvider,
  onProviderChange,
  disabled = false,
  expandedModelId,
  onToggleExpand
}: ModelCardListProps) {
  
  // ========================================
  // EMPTY STATE
  // ========================================
  
  if (models.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <SmartToyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: '1rem' }}>
          Nenhum modelo disponível
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Este vendor não possui modelos configurados no momento.
          Configure um provider para ver os modelos disponíveis.
        </Typography>
      </Box>
    );
  }
  
  // ========================================
  // RENDERIZAÇÃO DA LISTA
  // ========================================
  
  return (
    <Box>
      {/* Título e Contador */}
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        🤖 Modelos Disponíveis ({models.length})
      </Typography>
      
      {/* Lista de Cards */}
      {models.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          isSelected={selectedModel?.apiModelId === model.apiModelId}
          onSelect={() => onSelectModel(model.apiModelId)}
          selectedProvider={selectedProvider}
          onProviderChange={onProviderChange}
          disabled={disabled}
          isExpanded={expandedModelId !== undefined ? expandedModelId === model.apiModelId : undefined}
          onToggleExpand={onToggleExpand ? () => onToggleExpand(model.apiModelId) : undefined}
        />
      ))}
    </Box>
  );
});
