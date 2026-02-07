// frontend/src/contexts/CertificationCacheContext.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { certificationService } from '../services/certificationService';
import { api } from '../services/api';
import { ModelBadge } from '../types/model-rating';

/**
 * Dados de rating/badge de um modelo certificado
 */
interface CertificationRatingData {
  badge: ModelBadge | null;
  rating: number | null;
}

/**
 * Interface do contexto de cache de certificações
 */
interface CertificationCacheContextType {
  certifiedModels: string[];
  unavailableModels: string[];
  qualityWarningModels: string[];
  /** Mapa de modelId → dados de rating/badge (para TODOS os modelos certificados) */
  ratingDataMap: Record<string, CertificationRatingData>;
  loading: boolean;
  refresh: () => Promise<void>;
  isCertified: (modelId: string) => boolean;
  isUnavailable: (modelId: string) => boolean;
  hasQualityWarning: (modelId: string) => boolean;
  /** Obtém dados de rating/badge de um modelo pelo apiModelId */
  getRatingData: (modelId: string) => CertificationRatingData | undefined;
}

const CertificationCacheContext = createContext<CertificationCacheContextType | undefined>(undefined);

/**
 * Provider para gerenciar cache global de certificações
 * Permite que qualquer componente acesse e invalide o cache
 * 
 * ✅ Características:
 * - Cache global compartilhado entre todos os componentes
 * - Função refresh() para invalidar cache manualmente
 * - Previne múltiplas execuções simultâneas
 * - Logs detalhados para debugging
 * 
 * @example
 * <CertificationCacheProvider>
 *   <App />
 * </CertificationCacheProvider>
 */
export function CertificationCacheProvider({ children }: { children: ReactNode }) {
  const [certifiedModels, setCertifiedModels] = useState<string[]>([]);
  const [unavailableModels, setUnavailableModels] = useState<string[]>([]);
  const [qualityWarningModels, setQualityWarningModels] = useState<string[]>([]);
  const [ratingDataMap, setRatingDataMap] = useState<Record<string, CertificationRatingData>>({});
  const [loading, setLoading] = useState(true);
  
  // 🔒 Flag para prevenir múltiplas execuções simultâneas
  const isLoadingRef = useRef(false);
  
  /**
   * Carrega dados de certificação de todos os modelos
   * Faz 3 chamadas em paralelo para otimizar performance
   * 
   * 🔒 Protegido contra execuções simultâneas
   */
  const loadCertifications = useCallback(async () => {
    // 🔒 Prevenir múltiplas execuções simultâneas
    if (isLoadingRef.current) {
      console.log('[CertificationCacheContext] ⏭️ Execução já em andamento, pulando...');
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      console.log('[CertificationCacheContext] 📥 Iniciando carregamento de certificações...');
      
      // ✅ Sempre usar forceRefresh=true para garantir dados atualizados
      const [certified, failed, warnings, allCertifications] = await Promise.all([
        certificationService.getCertifiedModels(true),
        certificationService.getAllFailedModels(true),
        certificationService.getQualityWarningModels(true),
        // ✅ Busca TODAS as certificações para extrair badge/rating
        api.get('/certification-queue/certifications', {
          params: { limit: 1000, _t: Date.now() }
        }).then(res => res.data?.certifications || []).catch(() => [])
      ]);
      
      // ✅ Construir mapa de rating/badge a partir de TODAS as certificações
      const newRatingMap: Record<string, CertificationRatingData> = {};
      const VALID_BADGES = new Set(['PREMIUM', 'RECOMENDADO', 'FUNCIONAL', 'LIMITADO', 'NAO_RECOMENDADO', 'INDISPONIVEL']);
      for (const cert of allCertifications) {
        if (cert.modelId && cert.badge) {
          // ✅ Normalizar: badge pode vir em lowercase do backend
          const normalizedBadge = (cert.badge as string).toUpperCase();
          if (VALID_BADGES.has(normalizedBadge)) {
            newRatingMap[cert.modelId] = {
              badge: normalizedBadge as ModelBadge,
              rating: cert.rating ?? null
            };
          }
        }
      }
      
      console.log('[CertificationCacheContext] ✅ Certificações carregadas', {
        certified: certified.length,
        failed: failed.length,
        warnings: warnings.length,
        ratingData: Object.keys(newRatingMap).length,
        certifiedList: certified,
        failedList: failed,
        warningsList: warnings
      });
      
      setCertifiedModels(certified);
      setUnavailableModels(failed);
      setQualityWarningModels(warnings);
      setRatingDataMap(newRatingMap);
    } catch (error) {
      console.error('[CertificationCacheContext] ❌ Erro ao carregar certificações:', error);
      // NÃO setar estado de erro para evitar re-render loop
      // Apenas logar e manter arrays vazios
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);
  
  /**
   * ✅ Função para invalidar cache e recarregar dados
   * Útil após certificar modelos ou fazer alterações
   */
  const refresh = useCallback(async () => {
    console.log('[CertificationCacheContext] 🔄 Refresh solicitado, recarregando dados...');
    await loadCertifications();
  }, [loadCertifications]);
  
  /**
   * Verifica se um modelo está certificado
   */
  const isCertified = useCallback((modelId: string): boolean => {
    return certifiedModels.includes(modelId);
  }, [certifiedModels]);
  
  /**
   * Verifica se um modelo está indisponível
   */
  const isUnavailable = useCallback((modelId: string): boolean => {
    return unavailableModels.includes(modelId);
  }, [unavailableModels]);
  
  /**
   * Verifica se um modelo tem aviso de qualidade
   */
  const hasQualityWarning = useCallback((modelId: string): boolean => {
    return qualityWarningModels.includes(modelId);
  }, [qualityWarningModels]);
  
  /**
   * Obtém dados de rating/badge de um modelo pelo apiModelId
   * Fonte: cache global de certificações (todas, não filtrado por awsEnabledModels)
   */
  const getRatingData = useCallback((modelId: string): CertificationRatingData | undefined => {
    return ratingDataMap[modelId];
  }, [ratingDataMap]);
  
  // Carregar dados na montagem
  useEffect(() => {
    loadCertifications();
  }, [loadCertifications]);
  
  const value: CertificationCacheContextType = {
    certifiedModels,
    unavailableModels,
    qualityWarningModels,
    ratingDataMap,
    loading,
    refresh,
    isCertified,
    isUnavailable,
    hasQualityWarning,
    getRatingData
  };
  
  return (
    <CertificationCacheContext.Provider value={value}>
      {children}
    </CertificationCacheContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de cache de certificações
 * 
 * @example
 * const { certifiedModels, refresh } = useCertificationCacheContext();
 * // Após certificar modelos:
 * await refresh();
 */
export function useCertificationCacheContext() {
  const context = useContext(CertificationCacheContext);
  if (context === undefined) {
    throw new Error('useCertificationCacheContext must be used within a CertificationCacheProvider');
  }
  return context;
}
