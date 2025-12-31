// frontend/src/features/audit/hooks/useAuditLoader.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect } from 'react';
import { auditService, type AuditRecord } from '../../../services/auditService';

interface AuditLoaderState {
  audit: AuditRecord | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook de carregamento de auditoria por messageId.
 * 
 * Responsabilidade única: buscar dados de auditoria.
 * 
 * Não contém JSX, não acessa contexto, não toma decisões de UI.
 * Apenas carrega o AuditRecord completo via API.
 * 
 * IMPORTANTE: Este hook aceita messageId null/undefined para permitir que
 * componentes chamem hooks incondicionalmente (Rules of Hooks).
 * Quando messageId é null, retorna estado neutro sem fetch.
 * 
 * @param messageId - ID da mensagem a ser auditada (pode ser null)
 * @returns Estado com audit, loading e error
 */
export function useAuditLoader(messageId: string | null | undefined): AuditLoaderState {
  const [state, setState] = useState<AuditLoaderState>({
    audit: null,
    loading: !!messageId, // só inicia loading se tiver messageId
    error: null,
  });

  useEffect(() => {
    // Se não tem messageId, retorna estado neutro (sem loading, sem erro)
    if (!messageId) {
      setState({ audit: null, loading: false, error: null });
      return;
    }

    let isMounted = true;

    async function fetchAudit() {
      try {
        setState({ audit: null, loading: true, error: null });
        
        const data = await auditService.getAuditByMessageId(messageId);
        
        if (isMounted) {
          setState({ audit: data, loading: false, error: null });
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error 
            ? err.message 
            : 'Erro ao carregar auditoria';
          setState({ audit: null, loading: false, error: errorMessage });
        }
      }
    }

    fetchAudit();

    return () => {
      isMounted = false;
    };
  }, [messageId]);

  return state;
}
