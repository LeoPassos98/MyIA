// frontend/src/hooks/useCertificationCache.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useCertificationCacheContext } from '../contexts/CertificationCacheContext';

/**
 * Hook para gerenciar cache compartilhado de dados de certificação
 * Reduz chamadas API duplicadas entre componentes
 * 
 * ✅ MIGRADO: Agora usa CertificationCacheContext para cache global
 * 
 * ✅ Características:
 * - Busca dados uma única vez e compartilha entre componentes
 * - Cache global gerenciado por contexto
 * - Estados de loading e erro
 * - Funções auxiliares para verificação rápida
 * - Previne múltiplas execuções simultâneas
 * - ✅ Função refresh() para invalidar cache manualmente
 * 
 * @example
 * const { certifiedModels, isCertified, loading, refresh } = useCertificationCache();
 * if (isCertified('claude-3-opus')) {
 *   // Modelo está certificado
 * }
 * // Após certificar modelos:
 * await refresh();
 */
export function useCertificationCache() {
  // ✅ MIGRADO: Usar contexto global ao invés de estado local
  return useCertificationCacheContext();
}
