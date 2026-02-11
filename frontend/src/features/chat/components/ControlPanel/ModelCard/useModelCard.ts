// frontend/src/features/chat/components/ControlPanel/ModelCard/useModelCard.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * useModelCard Hook
 * 
 * Hook customizado que encapsula toda a lógica de estado e comportamento do ModelCard.
 * Separa a lógica da apresentação conforme STANDARDS.md Seção 3.0.
 * 
 * @module features/chat/components/ControlPanel/ModelCard
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useModelRating } from '@/hooks/useModelRating';
import type { ModelWithProviders } from '@/types/ai';
import {
  hasConfiguredProvider,
  shouldShowProviderSelector
} from './utils/modelValidators';

/**
 * Parâmetros do hook useModelCard
 */
export interface UseModelCardParams {
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
 * Retorno do hook useModelCard
 */
export interface UseModelCardReturn {
  // Estado
  isExpanded: boolean;
  hasConfiguredProvider: boolean;
  showProviderSelector: boolean;
  modelWithRating: ReturnType<typeof useModelRating>['getModelById'] extends (...args: any[]) => infer R ? R : never;
  
  // Handlers
  handleToggleExpand: () => void;
  handleRadioClick: (e: React.MouseEvent) => void;
  
  // Estilos computados
  cardStyles: Record<string, any>;
  
  // Props para sub-componentes
  collapsedProps: {
    model: ModelWithProviders;
    isSelected: boolean;
    disabled: boolean;
    handleRadioClick: (e: React.MouseEvent) => void;
  };
  expandedProps: {
    model: ModelWithProviders;
    isSelected: boolean;
    disabled: boolean;
    modelWithRating: ReturnType<typeof useModelRating>['getModelById'] extends (...args: any[]) => infer R ? R : never;
    handleRadioClick: (e: React.MouseEvent) => void;
  };
  providerSelectorProps: {
    model: ModelWithProviders;
    selectedProvider?: string;
    onProviderChange?: (providerSlug: string) => void;
  };
}

/**
 * Hook customizado para lógica do ModelCard
 * 
 * Gerencia:
 * - Estado de expansão (interno ou controlado)
 * - Rating do modelo
 * - Validações de provider
 * - Handlers de eventos
 * - Estilos computados
 * - Props para sub-componentes
 * 
 * @param params - Parâmetros do hook
 * @returns Objeto com estado, handlers e props para sub-componentes
 * 
 * @example
 * ```typescript
 * const logic = useModelCard({
 *   model,
 *   isSelected,
 *   onSelect,
 *   selectedProvider,
 *   onProviderChange
 * });
 * 
 * return (
 *   <Card sx={logic.cardStyles} onClick={logic.handleToggleExpand}>
 *     {!logic.isExpanded ? (
 *       <ModelCardCollapsed {...logic.collapsedProps} />
 *     ) : (
 *       <ModelCardExpanded {...logic.expandedProps} />
 *     )}
 *   </Card>
 * );
 * ```
 */
export function useModelCard({
  model,
  isSelected,
  onSelect,
  selectedProvider,
  onProviderChange,
  disabled = false,
  isExpanded: controlledIsExpanded,
  onToggleExpand
}: UseModelCardParams): UseModelCardReturn {
  
  // ========================================
  // ESTADO
  // ========================================
  
  // Estado de expansão interno (usado quando não controlado)
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  
  // Estado de expansão final (controlado ou interno)
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalIsExpanded;
  
  // ========================================
  // HOOKS EXTERNOS
  // ========================================
  
  // Hook para buscar rating do modelo
  const { getModelById } = useModelRating();
  const modelWithRating = getModelById(model.apiModelId);
  
  // ========================================
  // CÁLCULOS DERIVADOS
  // ========================================
  
  // Validações de provider
  const hasConfiguredProviderValue = hasConfiguredProvider(model);
  // hasMultipleProviders não é usado diretamente, mas mantido para referência futura
  const showProviderSelector = shouldShowProviderSelector(model, isSelected, onProviderChange);
  
  // ========================================
  // HANDLERS
  // ========================================
  
  /**
   * Handler para toggle de expansão (clique no card)
   */
  const handleToggleExpand = useCallback(() => {
    if (!disabled) {
      if (onToggleExpand) {
        onToggleExpand();
      } else {
        setInternalIsExpanded(!internalIsExpanded);
      }
    }
  }, [disabled, onToggleExpand, internalIsExpanded]);
  
  /**
   * Handler para seleção (clique no radio)
   */
  const handleRadioClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onSelect();
    }
  }, [disabled, onSelect]);
  
  // ========================================
  // EFEITOS
  // ========================================
  
  /**
   * Forçar expansão quando modelo está selecionado
   */
  useEffect(() => {
    if (isSelected && controlledIsExpanded === undefined) {
      setInternalIsExpanded(true);
    }
  }, [isSelected, controlledIsExpanded]);
  
  // ========================================
  // ESTILOS COMPUTADOS
  // ========================================
  
  /**
   * Estilos do card (memoizados para performance)
   */
  const cardStyles = useMemo(() => ({
    mb: 0.5,
    py: 1.75,
    px: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: isSelected ? 'primary.main' : 'divider',
    bgcolor: isSelected ? 'backgrounds.secondarySubtle' : 'background.paper',
    opacity: disabled ? 0.6 : 1,
    minHeight: isExpanded ? 'auto' : 64,
    maxHeight: isExpanded ? 'none' : 64,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: 'fadeIn 0.3s ease-in',
    '@keyframes fadeIn': {
      from: { opacity: 0, transform: 'translateY(4px)' },
      to: { opacity: 1, transform: 'translateY(0)' }
    },
    '&:hover': disabled ? {} : {
      elevation: 3,
      borderColor: isSelected ? 'primary.main' : 'primary.light',
      transform: 'translateY(-2px)',
      cursor: 'pointer'
    }
  }), [isSelected, isExpanded, disabled]);
  
  // ========================================
  // PROPS PARA SUB-COMPONENTES
  // ========================================
  
  const collapsedProps = useMemo(() => ({
    model,
    isSelected,
    disabled,
    handleRadioClick
  }), [model, isSelected, disabled, handleRadioClick]);
  
  const expandedProps = useMemo(() => ({
    model,
    isSelected,
    disabled,
    modelWithRating,
    handleRadioClick
  }), [model, isSelected, disabled, modelWithRating, handleRadioClick]);
  
  const providerSelectorProps = useMemo(() => ({
    model,
    selectedProvider,
    onProviderChange
  }), [model, selectedProvider, onProviderChange]);
  
  // ========================================
  // RETORNO
  // ========================================
  
  return {
    // Estado
    isExpanded,
    hasConfiguredProvider: hasConfiguredProviderValue,
    showProviderSelector,
    modelWithRating,
    
    // Handlers
    handleToggleExpand,
    handleRadioClick,
    
    // Estilos
    cardStyles,
    
    // Props para sub-componentes
    collapsedProps,
    expandedProps,
    providerSelectorProps
  };
}
