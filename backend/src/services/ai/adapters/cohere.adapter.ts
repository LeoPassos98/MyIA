// backend/src/services/ai/adapters/cohere.adapter.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * REFATORADO: Clean Slate v2 - Fase 7 (Cleanup)
 * - Removido ModelRegistry completamente
 * - Usa adapterParamsService.getRecommendedParams() para buscar parâmetros do banco
 * - Fallback para valores hardcoded específicos do vendor Cohere
 * 
 * REFATORADO: Resolução de dependência circular
 * - Substituído import de AdapterFactory por adapterParamsService
 */

import { InferenceType } from '../types';
import { logger } from '../../../utils/logger';
import { adapterParamsService } from './adapter-params.service';
import {
  BaseModelAdapter,
  Message,
  UniversalOptions,
  AdapterPayload,
  AdapterChunk,
} from './base.adapter';

/**
 * Adapter for Cohere Command models (Legacy - ON_DEMAND)
 *
 * Supports Cohere models across different platforms:
 * - AWS Bedrock (cohere.*)
 * - Direct API (command-*)
 *
 * IMPORTANT: Cohere uses a different message format:
 * - 'message' (singular) for the last user message
 * - 'chat_history' for previous messages
 * - 'preamble' instead of 'system'
 * - 'p' instead of 'top_p'
 * - Does NOT support 'stream' in payload (controlled by platform)
 *
 * @deprecated Use CohereOnDemandAdapter instead
 */
export class CohereAdapter extends BaseModelAdapter {
  readonly vendor = 'cohere';
  readonly inferenceType: InferenceType = 'ON_DEMAND';
  
  readonly supportedModels = [
    // AWS Bedrock format (only format currently supported)
    'cohere.command-r-v1:0',
    'cohere.command-r-plus-v1:0',
    'cohere.command-light-v14',
    'cohere.command-text-v14',
    'cohere.command-*', // Wildcard for all Bedrock Cohere models
    
    // Note: Direct API format (command-*) will be added when DirectProvider is implemented
  ];

  /**
   * Cache de parâmetros para evitar múltiplas buscas assíncronas
   */
  private paramsCache: Map<string, { temperature?: number; topP?: number; maxTokens?: number }> = new Map();

  /**
   * Busca parâmetros recomendados do banco (com cache)
   *
   * Prioridade:
   * 1. Cache local
   * 2. Banco de dados (via adapterParamsService)
   * 3. Valores hardcoded para Cohere
   */
  private async getRecommendedParams(modelId: string): Promise<{ temperature?: number; topP?: number; maxTokens?: number }> {
    // 1. Verificar cache local
    if (this.paramsCache.has(modelId)) {
      return this.paramsCache.get(modelId)!;
    }

    // 2. Tentar buscar do banco via adapterParamsService
    try {
      const params = await adapterParamsService.getRecommendedParams(modelId, this.vendor);
      this.paramsCache.set(modelId, params);
      return params;
    } catch {
      logger.debug(`[CohereAdapter] Failed to get params from adapterParamsService for ${modelId}`);
    }

    // 3. Valores hardcoded padrão para Cohere
    const defaultParams = {
      temperature: 0.3,
      topP: 0.75,
      maxTokens: 2048,
    };
    this.paramsCache.set(modelId, defaultParams);
    return defaultParams;
  }

  formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    // Cohere uses 'message' (singular) for the last user message
    // and 'chat_history' for previous messages
    const chatHistory = conversationMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: m.content,
    }));
    
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    
    // 🎯 MODO AUTO/MANUAL: Buscar recommendedParams
    // NOTA: Como formatRequest é síncrono, usamos cache ou valores padrão
    let recommendedParams: { temperature?: number; topP?: number; maxTokens?: number } | undefined;
    
    if (options.modelId) {
      // Verificar cache primeiro (síncrono)
      if (this.paramsCache.has(options.modelId)) {
        recommendedParams = this.paramsCache.get(options.modelId);
      } else {
        // Popular cache em background (não bloqueia)
        this.getRecommendedParams(options.modelId).catch(() => {
          // Ignorar erros - já temos fallback hardcoded
        });
      }
    }

    // Aplicar fallback: Manual (options) → Auto (recommendedParams) → Hardcoded defaults
    const temperature = options.temperature ?? recommendedParams?.temperature ?? 0.3;
    const topP = options.topP ?? recommendedParams?.topP ?? 0.75;
    const maxTokens = options.maxTokens ?? recommendedParams?.maxTokens ?? 2048;
    
    const body: Record<string, unknown> = {
      message: lastMessage?.content || '',
      temperature: temperature,
      max_tokens: maxTokens,
    };

    // Add chat_history if there are previous messages
    if (chatHistory.length > 0) {
      body.chat_history = chatHistory;
    }

    // Add preamble (equivalent to system message)
    if (systemMessage) {
      body.preamble = systemMessage.content;
    }

    // Cohere supports p (top_p)
    if (topP !== undefined) {
      body.p = topP;
    }

    // NOTE: Streaming is controlled by InvokeModelWithResponseStreamCommand,
    // not by the payload. Do NOT add 'stream: true' here.

    if (options.stopSequences && options.stopSequences.length > 0) {
      body.stop_sequences = options.stopSequences;
    }

    return {
      body,
      contentType: 'application/json',
      accept: 'application/json',
    };
  }

  parseChunk(chunk: Record<string, unknown>): AdapterChunk {
    // Text chunk
    if (chunk.text) {
      return {
        type: 'chunk',
        content: chunk.text as string,
      };
    }
    
    // Stream finished
    if (chunk.is_finished) {
      return {
        type: 'done',
        metadata: {
          finishReason: chunk.finish_reason,
        },
      };
    }

    // Error handling
    const message = chunk.message as string | undefined;
    if (chunk.error || message?.includes('error')) {
      return {
        type: 'error',
        error: (chunk.error as string) || message || 'Unknown error',
      };
    }

    // Default: empty chunk (ignore other event types)
    return {
      type: 'chunk',
      content: '',
    };
  }
}
