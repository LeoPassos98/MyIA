// frontend/src/hooks/useModelBadges.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useModelRating } from './useModelRating';
import { useCertificationCache } from './useCertificationCache';
import { ModelBadge as BadgeType } from '../types/model-rating';
import { CertificationDetails } from '../types/ai';

/**
 * Interface para dados de badges de um modelo
 * Contém dados brutos e decisões sobre quais badges mostrar
 */
export interface ModelBadgesData {
  // Dados brutos
  rating?: number;
  badge?: BadgeType;
  isCertified: boolean;
  hasQualityWarning: boolean;
  isUnavailable: boolean;
  isRateLimited: boolean;
  
  // Decisões (qual badge mostrar)
  shouldShowRatingBadge: boolean;
  shouldShowCertifiedBadge: boolean;
  shouldShowQualityBadge: boolean;
  shouldShowUnavailableBadge: boolean;
  shouldShowRateLimitBadge: boolean;
  shouldShowNotTestedBadge: boolean;
}

/**
 * Interface para modelo com informações de erro e certificação opcional
 */
interface ModelWithError {
  apiModelId: string;
  error?: string;
  /** Dados de certificação em tempo real (opcional) - sobrescreve cache */
  certificationResult?: CertificationDetails;
}

/**
 * Hook centralizado para gerenciar badges de modelos
 * Encapsula toda a lógica de decisão de badges e busca de dados
 *
 * ✅ Características:
 * - Busca dados de rating e certificação automaticamente
 * - Decide quais badges mostrar baseado em prioridades
 * - Evita duplicação de lógica entre componentes
 * - Performance otimizada com cache compartilhado
 * - Suporta dados de certificação em tempo real (sobrescreve cache)
 *
 * ✅ Regras de Prioridade:
 * 1. Badge de Rating (se existir)
 * 2. Badge Certificado (se certificado)
 * 3. Badge de Qualidade (se tem warning)
 * 4. Badge Rate Limit (se excedeu limite)
 * 5. Badge Indisponível (se falhou e não tem rating)
 * 6. Badge Não Testado (se não tem nenhum dos anteriores)
 *
 * @example
 * const badges = useModelBadges({ apiModelId: 'claude-3-opus' });
 * if (badges.shouldShowRatingBadge) {
 *   // Mostrar badge de rating
 * }
 */
export function useModelBadges(model: ModelWithError): ModelBadgesData {
  const { getModelById } = useModelRating();
  const { isCertified, isUnavailable, hasQualityWarning } = useCertificationCache();
  
  // Buscar dados do modelo
  const modelWithRating = getModelById(model.apiModelId);
  const hasBadge = !!modelWithRating?.badge;
  const isRateLimited = model.error?.includes('Limite de certificações excedido') ?? false;
  
  // ✅ FIX: Usar dados de certificação em tempo real se disponíveis (sobrescreve cache)
  // Isso permite que badges sejam atualizados durante a certificação via SSE
  let certified: boolean;
  let unavailable: boolean;
  let qualityWarning: boolean;
  
  if (model.certificationResult) {
    // Usar dados em tempo real da certificação
    certified = model.certificationResult.status === 'certified';
    unavailable = model.certificationResult.status === 'failed';
    qualityWarning = model.certificationResult.status === 'quality_warning';
  } else {
    // Usar cache (comportamento padrão)
    certified = isCertified(model.apiModelId);
    unavailable = isUnavailable(model.apiModelId);
    qualityWarning = hasQualityWarning(model.apiModelId);
  }
  
  return {
    // Dados brutos
    rating: modelWithRating?.rating,
    badge: modelWithRating?.badge,
    isCertified: certified,
    hasQualityWarning: qualityWarning,
    isUnavailable: unavailable,
    isRateLimited,
    
    // Decisões de exibição
    // 1. Badge de Rating tem prioridade máxima
    shouldShowRatingBadge: hasBadge,
    
    // 2. Badge Certificado (se certificado)
    shouldShowCertifiedBadge: certified,
    
    // 3. Badge de Qualidade (se tem warning)
    shouldShowQualityBadge: qualityWarning,
    
    // 4. Badge Indisponível (se falhou, não tem badge e não é rate limit)
    shouldShowUnavailableBadge: unavailable && !hasBadge && !isRateLimited,
    
    // 5. Badge Rate Limit (se excedeu limite e não tem badge)
    shouldShowRateLimitBadge: isRateLimited && !hasBadge,
    
    // 6. Badge Não Testado (se não tem nenhum dos anteriores)
    shouldShowNotTestedBadge: !hasBadge && !certified && !qualityWarning && !unavailable
  };
}
