/**
 * Models API Service
 * 
 * Serviço para comunicação com os endpoints de capabilities do backend.
 * Gerencia fetch de capabilities individuais e em lote.
 */

import axios, { AxiosError } from 'axios';
import type {
  ModelCapabilities,
  ModelCapabilitiesResponse,
  AllCapabilitiesResponse,
  CapabilitiesError,
} from '../../types/capabilities';

// Base URL da API - usar URL vazia para aproveitar o proxy do Vite
// O Vite faz proxy de /api para http://localhost:3001
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Busca as capabilities de um modelo específico
 * 
 * @param modelId - ID do modelo (formato: provider:model-name)
 * @returns Promise com as capabilities do modelo
 * @throws CapabilitiesError se houver erro na requisição
 * 
 * @example
 * ```typescript
 * const capabilities = await fetchModelCapabilities('anthropic:claude-3-5-sonnet-20241022');
 * console.log(capabilities.temperature.max); // 1.0
 * ```
 */
export async function fetchModelCapabilities(
  modelId: string
): Promise<ModelCapabilities> {
  const url = `${API_BASE_URL}/api/models/${encodeURIComponent(modelId)}/capabilities`;
  
  // 🔍 DEBUG: Log da URL completa
  console.log('[fetchModelCapabilities] Fetching:', { modelId, url });
  
  try {
    const response = await axios.get<ModelCapabilitiesResponse>(
      url,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 segundos
      }
    );

    // 🔍 DEBUG: Log da resposta
    console.log('[fetchModelCapabilities] Response:', {
      status: response.status,
      data: response.data
    });

    // Validar resposta JSend
    if (response.data.status === 'success' && response.data.data) {
      // O backend retorna as capabilities com spread: { ...capabilities, _meta }
      // Precisamos extrair apenas as capabilities, removendo _meta
      const data = response.data.data as any;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _meta, ...capabilities } = data;
      
      console.log('[fetchModelCapabilities] Parsed capabilities:', capabilities);
      return capabilities as ModelCapabilities;
    }

    // Resposta com status fail ou error
    throw new Error(response.data.message || 'Failed to fetch capabilities');
  } catch (error) {
    // 🔍 DEBUG: Log do erro
    console.error('[fetchModelCapabilities] Error:', error);
    
    // Tratar erros de rede e HTTP
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ModelCapabilitiesResponse>;
      
      console.error('[fetchModelCapabilities] Axios error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        code: axiosError.code,
        message: axiosError.message
      });
      
      // Erro 404 - Modelo não encontrado
      if (axiosError.response?.status === 404) {
        const capError: CapabilitiesError = {
          message: `Model not found: ${modelId}`,
          status: 404,
          code: 'MODEL_NOT_FOUND',
        };
        throw capError;
      }

      // Erro 500 - Erro interno do servidor
      if (axiosError.response?.status === 500) {
        const capError: CapabilitiesError = {
          message: axiosError.response.data?.message || 'Internal server error',
          status: 500,
          code: 'SERVER_ERROR',
        };
        throw capError;
      }

      // Erro de timeout
      if (axiosError.code === 'ECONNABORTED') {
        const capError: CapabilitiesError = {
          message: 'Request timeout',
          code: 'TIMEOUT',
        };
        throw capError;
      }

      // Erro de rede genérico
      const capError: CapabilitiesError = {
        message: axiosError.message || 'Network error',
        status: axiosError.response?.status,
        code: 'NETWORK_ERROR',
      };
      throw capError;
    }

    // Erro desconhecido
    const capError: CapabilitiesError = {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'UNKNOWN_ERROR',
    };
    throw capError;
  }
}

/**
 * Busca as capabilities de todos os modelos disponíveis
 * 
 * Útil para prefetch e popular o cache do React Query.
 * 
 * @returns Promise com um Record de modelId -> capabilities
 * @throws CapabilitiesError se houver erro na requisição
 * 
 * @example
 * ```typescript
 * const allCapabilities = await fetchAllCapabilities();
 * console.log(allCapabilities['anthropic:claude-3-5-sonnet-20241022']);
 * ```
 */
export async function fetchAllCapabilities(): Promise<Record<string, ModelCapabilities>> {
  try {
    const response = await axios.get<AllCapabilitiesResponse>(
      `${API_BASE_URL}/api/models/capabilities`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 segundos (pode ter muitos modelos)
      }
    );

    // Validar resposta JSend
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }

    // Resposta com status fail ou error
    throw new Error(response.data.message || 'Failed to fetch all capabilities');
  } catch (error) {
    // Tratar erros de rede e HTTP
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<AllCapabilitiesResponse>;
      
      // Erro 500 - Erro interno do servidor
      if (axiosError.response?.status === 500) {
        const capError: CapabilitiesError = {
          message: axiosError.response.data?.message || 'Internal server error',
          status: 500,
          code: 'SERVER_ERROR',
        };
        throw capError;
      }

      // Erro de timeout
      if (axiosError.code === 'ECONNABORTED') {
        const capError: CapabilitiesError = {
          message: 'Request timeout',
          code: 'TIMEOUT',
        };
        throw capError;
      }

      // Erro de rede genérico
      const capError: CapabilitiesError = {
        message: axiosError.message || 'Network error',
        status: axiosError.response?.status,
        code: 'NETWORK_ERROR',
      };
      throw capError;
    }

    // Erro desconhecido
    const capError: CapabilitiesError = {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'UNKNOWN_ERROR',
    };
    throw capError;
  }
}
