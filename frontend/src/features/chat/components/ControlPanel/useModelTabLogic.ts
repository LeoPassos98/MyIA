// frontend/src/features/chat/components/ControlPanel/useModelTabLogic.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { aiProvidersService } from '../../../../services/aiProvidersService';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useModelRating } from '../../../../hooks/useModelRating';
import { filterModels, sortModels } from '../../../../utils/rating-helpers';
import type { VendorGroup, ModelWithProviders } from '../../../../types/ai';
import type { ModelFilters, ModelWithRating } from '../../../../types/model-rating';
import { logger } from '../../../../utils/logger';

export interface UseModelTabLogicReturn {
  // Dados
  vendors: VendorGroup[];
  selectedVendor: VendorGroup | null;
  filteredModels: ModelWithProviders[];
  selectedModel: ModelWithProviders | null;
  selectedProvider: string | null;
  
  // Estados
  isLoading: boolean;
  error: string | null;
  
  // Filtros e ordenação
  filters: ModelFilters;
  setFilters: (filters: ModelFilters) => void;
  
  // Handlers
  handleSelectVendor: (vendorSlug: string) => void;
  handleSelectModel: (modelId: string) => void;
  handleChangeProvider: (providerSlug: string) => void;
  
  // Utilitários
  refreshData: () => Promise<void>;
}

/**
 * Hook de lógica para ModelTab refatorado (vendor-first)
 * 
 * Gerencia:
 * - Busca de dados de vendors/modelos
 * - Seleção de vendor, modelo e provider
 * - Sincronização com LayoutContext (chatConfig)
 * - Estados de loading/erro
 * 
 * @example
 * ```tsx
 * const {
 *   vendors,
 *   selectedVendor,
 *   filteredModels,
 *   handleSelectVendor,
 *   handleSelectModel
 * } = useModelTabLogic();
 * ```
 */
export function useModelTabLogic(): UseModelTabLogicReturn {
  const { chatConfig, updateChatConfig } = useLayout();
  const { getModelById } = useModelRating();
  
  // Estados locais
  const [vendors, setVendors] = useState<VendorGroup[]>([]);
  const [selectedVendorSlug, setSelectedVendorSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado de filtros e ordenação
  const [filters, setFilters] = useState<ModelFilters>({
    sortBy: 'rating',
    sortOrder: 'desc'
  });
  
  // Ref para rastrear se a seleção foi manual (evitar sobrescrever com auto-detecção)
  const isManualSelectionRef = useRef(false);

  /**
   * Busca dados de vendors/modelos do backend
   */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await aiProvidersService.getByVendor();
      setVendors(data.vendors);
      
      logger.info('🏢 [useModelTabLogic] Vendors carregados:', {
        count: data.vendors.length,
        vendors: data.vendors.map(v => v.slug)
      });
      
      // Auto-selecionar primeiro vendor se nenhum selecionado
      if (!selectedVendorSlug && data.vendors.length > 0) {
        setSelectedVendorSlug(data.vendors[0].slug);
      }
      
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Erro ao carregar modelos. Verifique sua conexão e tente novamente.';
      setError(message);
      logger.error('❌ [useModelTabLogic] Erro ao buscar vendors:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVendorSlug]);

  /**
   * Carrega dados ao montar componente
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * ✅ Listener para evento de atualização de credenciais AWS
   * Recarrega vendors quando AWS Settings são salvos
   */
  useEffect(() => {
    const handleAWSUpdate = () => {
      logger.info('🔄 [useModelTabLogic] Evento aws-credentials-updated recebido, recarregando vendors...');
      fetchData();
    };
    
    window.addEventListener('aws-credentials-updated', handleAWSUpdate);
    return () => window.removeEventListener('aws-credentials-updated', handleAWSUpdate);
  }, [fetchData]);

  /**
   * Detecta vendor atual baseado no modelo selecionado no chatConfig
   * ⚠️ Só executa se NÃO for seleção manual (evita sobrescrever escolha do usuário)
   */
  useEffect(() => {
    if (vendors.length === 0 || !chatConfig.model) return;
    
    // ✅ Respeitar seleção manual do usuário
    if (isManualSelectionRef.current) {
      logger.info('🚫 [useModelTabLogic] Auto-detecção ignorada (seleção manual ativa)');
      return;
    }
    
    // Encontrar vendor do modelo atual
    for (const vendor of vendors) {
      const modelExists = vendor.models.some(m => m.apiModelId === chatConfig.model);
      if (modelExists) {
        // Só atualizar se mudou (evitar re-renders)
        if (selectedVendorSlug !== vendor.slug) {
          setSelectedVendorSlug(vendor.slug);
          logger.info('🔍 [useModelTabLogic] Vendor detectado automaticamente:', {
            model: chatConfig.model,
            vendor: vendor.slug
          });
        }
        break;
      }
    }
  }, [vendors, chatConfig.model, selectedVendorSlug]);

  /**
   * Vendor selecionado (objeto completo)
   */
  const selectedVendor = useMemo(() => {
    return vendors.find(v => v.slug === selectedVendorSlug) || null;
  }, [vendors, selectedVendorSlug]);

  /**
   * Modelos filtrados do vendor selecionado com rating, filtros e ordenação aplicados
   * Validação de edge case: vendor sem modelos
   */
  const filteredModels = useMemo(() => {
    const models = selectedVendor?.models || [];
    
    if (selectedVendor && models.length === 0) {
      logger.warn('⚠️ [useModelTabLogic] Vendor sem modelos:', selectedVendor.slug);
      return [];
    }
    
    // Enriquecer modelos com dados de rating
    const modelsWithRating: ModelWithRating[] = models.map(model => {
      const ratingData = getModelById(model.apiModelId);
      return {
        id: model.id,
        name: model.name,
        provider: model.availableOn[0]?.providerName || 'Unknown',
        isAvailable: model.availableOn.some(p => p.isConfigured),
        apiModelId: model.apiModelId,
        contextWindow: model.contextWindow,
        rating: ratingData?.rating,
        badge: ratingData?.badge,
        metrics: ratingData?.metrics,
        scores: ratingData?.scores,
        ratingUpdatedAt: ratingData?.ratingUpdatedAt
      };
    });
    
    // Aplicar filtros
    let filtered = filterModels(modelsWithRating, filters);
    
    // Aplicar ordenação
    if (filters.sortBy) {
      filtered = sortModels(filtered, filters.sortBy, filters.sortOrder);
    }
    
    // Converter de volta para ModelWithProviders mantendo os dados originais
    const filteredIds = new Set(filtered.map(m => m.apiModelId));
    const result = models.filter(m => filteredIds.has(m.apiModelId));
    
    // Ordenar result na mesma ordem que filtered
    result.sort((a, b) => {
      const indexA = filtered.findIndex(f => f.apiModelId === a.apiModelId);
      const indexB = filtered.findIndex(f => f.apiModelId === b.apiModelId);
      return indexA - indexB;
    });
    
    logger.info('🔍 [useModelTabLogic] Modelos filtrados:', {
      total: models.length,
      filtered: result.length,
      filters
    });
    
    return result;
  }, [selectedVendor, filters, getModelById]);

  /**
   * Modelo selecionado (baseado em chatConfig.model)
   */
  const selectedModel = useMemo(() => {
    if (!chatConfig.model) return null;
    return filteredModels.find(m => m.apiModelId === chatConfig.model) || null;
  }, [filteredModels, chatConfig.model]);

  /**
   * Provider ativo (baseado em chatConfig.provider)
   */
  const selectedProvider = useMemo(() => {
    return chatConfig.provider || null;
  }, [chatConfig.provider]);

  /**
   * Handler: Selecionar vendor
   * ✅ Marca como seleção manual para evitar sobrescrita pela auto-detecção
   */
  const handleSelectVendor = useCallback((vendorSlug: string) => {
    logger.info('🏢 [useModelTabLogic] Vendor selecionado manualmente:', vendorSlug);
    isManualSelectionRef.current = true; // ✅ Marcar como seleção manual
    setSelectedVendorSlug(vendorSlug);
  }, []); // Sem dependências, função estável

  /**
   * Handler: Selecionar modelo
   * Atualiza chatConfig com modelo e provider padrão
   * ✅ Reseta flag de seleção manual (permite auto-detecção após seleção de modelo)
   */
  const handleSelectModel = useCallback((modelId: string) => {
    const model = filteredModels.find(m => m.apiModelId === modelId);
    if (!model) {
      logger.error('❌ [useModelTabLogic] Modelo não encontrado:', modelId);
      return;
    }

    // Encontrar provider configurado (priorizar o atual se disponível)
    const currentProviderAvailable = model.availableOn.find(
      p => p.providerSlug === chatConfig.provider && p.isConfigured
    );
    
    const defaultProvider = currentProviderAvailable ||
      model.availableOn.find(p => p.isConfigured) ||
      model.availableOn[0];

    if (!defaultProvider) {
      logger.error('❌ [useModelTabLogic] Nenhum provider disponível para modelo:', modelId);
      return;
    }

    logger.info('🤖 [useModelTabLogic] Modelo selecionado:', {
      model: modelId,
      provider: defaultProvider.providerSlug,
      vendor: selectedVendorSlug
    });

    // ✅ Resetar flag de seleção manual (navegação concluída)
    isManualSelectionRef.current = false;

    updateChatConfig({
      model: modelId,
      provider: defaultProvider.providerSlug,
      vendorSlug: selectedVendorSlug || undefined
    });
  }, [filteredModels, chatConfig.provider, selectedVendorSlug, updateChatConfig]);

  /**
   * Handler: Trocar provider do modelo atual
   * Memoizado para evitar re-renders
   */
  const handleChangeProvider = useCallback((providerSlug: string) => {
    if (!selectedModel) {
      logger.error('❌ [useModelTabLogic] Nenhum modelo selecionado');
      return;
    }

    const providerAvailable = selectedModel.availableOn.find(
      p => p.providerSlug === providerSlug
    );

    if (!providerAvailable?.isConfigured) {
      logger.error('❌ [useModelTabLogic] Provider não configurado:', providerSlug);
      return;
    }

    logger.info('🔄 [useModelTabLogic] Provider alterado:', {
      model: selectedModel.apiModelId,
      from: chatConfig.provider,
      to: providerSlug
    });

    updateChatConfig({ provider: providerSlug });
  }, [selectedModel, chatConfig.provider, updateChatConfig]);

  return {
    // Dados
    vendors,
    selectedVendor,
    filteredModels,
    selectedModel,
    selectedProvider,
    
    // Estados
    isLoading,
    error,
    
    // Filtros e ordenação
    filters,
    setFilters,
    
    // Handlers
    handleSelectVendor,
    handleSelectModel,
    handleChangeProvider,
    
    // Utilitários
    refreshData: fetchData
  };
}
