// frontend/src/features/promptTrace/hooks/usePromptTraceLoader.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect } from 'react';
import { promptTraceService } from '../services/promptTraceService';
import type { PromptTraceRecord } from '../types';

interface PromptTraceLoaderState {
    trace: PromptTraceRecord | null;
    loading: boolean;
    error: string | null;
}

/**
 * Hook de carregamento de Prompt Trace por traceId.
 *
 * Responsabilidade única: buscar dados de trace.
 *
 * @param traceId - ID do trace a ser carregado
 * @returns Estado com trace, loading e error
 */
export function usePromptTraceLoader(traceId: string | undefined): PromptTraceLoaderState {
    const [state, setState] = useState<PromptTraceLoaderState>({
        trace: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!traceId) {
            setState({ trace: null, loading: false, error: 'Trace ID não fornecido' });
            return;
        }

        const id = traceId; // ✅ agora é string garantido aqui

        let isMounted = true;

        async function fetchTrace() {
            try {
                setState({ trace: null, loading: true, error: null });

                const data = await promptTraceService.getPromptTraceById(id); // ✅ usa id

                if (isMounted) {
                    setState({ trace: data, loading: false, error: null });
                }
            } catch (err) {
                if (isMounted) {
                    const errorMessage =
                        err instanceof Error ? err.message : 'Erro ao carregar trace';
                    setState({ trace: null, loading: false, error: errorMessage });
                }
            }
        }

        fetchTrace();

        return () => {
            isMounted = false;
        };
    }, [traceId]);

    return state;
}
