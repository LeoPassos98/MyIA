// frontend/src/features/chat/components/ControlPanel/ModelCard/ModelCard.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * ModelCard Component
 *
 * Card de modelo com radio button, badges de providers e informações completas.
 * Expande para mostrar dropdown de provider quando selecionado e há múltiplos providers.
 *
 * @module features/chat/components/ControlPanel/ModelCard
 */

import React from 'react';
import { Card, Collapse } from '@mui/material';
import { useModelCard } from './useModelCard';
import { ModelCardCollapsed } from './components/ModelCardCollapsed';
import { ModelCardExpanded } from './components/ModelCardExpanded';
import { ModelCardUnconfigured } from './components/ModelCardUnconfigured';
import { ProviderSelector } from './components/ProviderSelector';
import type { ModelWithProviders } from '@/types/ai';

/**
 * Props do componente ModelCard
 */
export interface ModelCardProps {
  /** Modelo a ser exibido */
  model: ModelWithProviders;
  /** Se o modelo está selecionado */
  isSelected: boolean;
  /** Callback ao selecionar/desselecionar */
  onSelect: () => void;
  /** Provider ativo se modelo selecionado */
  selectedProvider?: string;
  /** Callback ao trocar provider */
  onProviderChange?: (providerSlug: string) => void;
  /** Se o card está desabilitado */
  disabled?: boolean;
  /** Se o card está expandido (accordion controlado) */
  isExpanded?: boolean;
  /** Callback ao alternar expansão */
  onToggleExpand?: () => void;
}

/**
 * Card de modelo com radio button, badges de providers e informações completas
 *
 * Exibe um card compacto para cada modelo com radio button, badges de providers,
 * certificação, context window, capabilities e pricing.
 *
 * Suporta modo accordion: colapsado por padrão, expandido ao clicar.
 * Modelo selecionado fica sempre expandido.
 *
 * @example
 * ```tsx
 * <ModelCard
 *   model={model}
 *   isSelected={selectedModel?.id === model.id}
 *   onSelect={() => handleSelectModel(model.id)}
 *   selectedProvider="aws"
 *   onProviderChange={(provider) => handleProviderChange(provider)}
 * />
 * ```
 */
export const ModelCard = React.memo(function ModelCard({
  model,
  isSelected,
  onSelect,
  selectedProvider,
  onProviderChange,
  disabled = false,
  isExpanded: controlledIsExpanded,
  onToggleExpand
}: ModelCardProps) {
  
  // ========================================
  // LÓGICA (HOOK CUSTOMIZADO)
  // ========================================
  
  const logic = useModelCard({
    model,
    isSelected,
    onSelect,
    selectedProvider,
    onProviderChange,
    disabled,
    isExpanded: controlledIsExpanded,
    onToggleExpand
  });
  
  // ========================================
  // EDGE CASE: SEM PROVIDERS CONFIGURADOS
  // ========================================
  
  if (!logic.hasConfiguredProvider) {
    return <ModelCardUnconfigured model={model} />;
  }
  
  // ========================================
  // RENDERIZAÇÃO PRINCIPAL
  // ========================================
  
  return (
    <Card
      elevation={isSelected ? 2 : 1}
      sx={logic.cardStyles}
      onClick={logic.handleToggleExpand}
    >
      {/* Estado Colapsado */}
      {!logic.isExpanded && (
        <ModelCardCollapsed {...logic.collapsedProps} />
      )}
      
      {/* Estado Expandido */}
      {logic.isExpanded && (
        <ModelCardExpanded {...logic.expandedProps} />
      )}
      
      {/* Seletor de Provider (quando múltiplos) */}
      <Collapse in={logic.showProviderSelector} timeout="auto">
        <ProviderSelector {...logic.providerSelectorProps} />
      </Collapse>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders desnecessários
  return (
    prevProps.model.id === nextProps.model.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectedProvider === nextProps.selectedProvider &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isExpanded === nextProps.isExpanded
  );
});
