// backend/src/services/ai/adapters/on-demand/anthropic-on-demand.adapter.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * REFATORADO: Clean Slate v2 - Fase 7 (Cleanup)
 * - Removido ModelRegistry completamente
 * - Usa adapterParamsService.getRecommendedParams() para buscar parâmetros do banco
 * - Fallback para valores hardcoded específicos do vendor Anthropic
 * 
 * REFATORADO: Resolução de dependência circular
 * - Substituído import de AdapterFactory por adapterParamsService
 */

import {
  BaseModelAdapter,
  Message,
  UniversalOptions,
  AdapterPayload,
  AdapterChunk,
} from '../base.adapter';
import { InferenceType } from '../../types';
import { adapterParamsService } from '../adapter-params.service';
import { logger } from '../../../../utils/logger';

/**
 * Adapter for Anthropic Claude models (ON_DEMAND)
 * 
 * Supports Claude 3.x models on AWS Bedrock without regional prefix:
 * - anthropic.claude-3-5-sonnet-20241022-v2:0
 * - anthropic.claude-3-5-haiku-20241022-v1:0
 * - anthropic.claude-3-haiku-20240307-v1:0
 * 
 * Does NOT support Inference Profile format (us.anthropic.*)
 * Use AnthropicProfileAdapter for Inference Profiles.
 */
export class AnthropicOnDemandAdapter extends BaseModelAdapter {
  readonly vendor = 'anthropic';
  readonly inferenceType: InferenceType = 'ON_DEMAND';
  
  readonly supportedModels = [
    // AWS Bedrock format (without regional prefix)
    'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'anthropic.claude-3-5-haiku-20241022-v1:0',
    'anthropic.claude-3-haiku-20240307-v1:0',
    'anthropic.claude-haiku-4-5-20251001-v1:0',
    'anthropic.claude-sonnet-4-20250514-v1:0',
    'anthropic.claude-*', // Wildcard for all Bedrock Claude models
  ];

  /**
   * Cache de parâmetros para evitar múltiplas buscas assíncronas
   */
  private paramsCache: Map<string, { temperature?: number; topP?: number; maxTokens?: number }> = new Map();

  /**
   * Override supportsModel to reject Inference Profile format
   */
  supportsModel(modelId: string): boolean {
    // Reject Inference Profile format (us.anthropic.*, eu.anthropic.*, etc.)
    if (/^(us|eu|apac)\.anthropic\./i.test(modelId)) {
      return false;
    }

    // Use base implementation for standard format
    return super.supportsModel(modelId);
  }

  /**
   * Busca parâmetros recomendados do banco (com cache)
   *
   * Prioridade:
   * 1. Cache local
   * 2. Banco de dados (via adapterParamsService)
   * 3. Valores hardcoded para Anthropic
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
      logger.debug(`[AnthropicOnDemandAdapter] Failed to get params from adapterParamsService for ${modelId}`);
    }

    // 3. Valores hardcoded padrão para Anthropic
    const defaultParams = {
      temperature: 1.0,
      topP: 0.999,
      maxTokens: 4096,
    };
    this.paramsCache.set(modelId, defaultParams);
    return defaultParams;
  }

  formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    // 🎯 MODO AUTO/MANUAL: Buscar recommendedParams
    // NOTA: Como formatRequest é síncrono, usamos cache ou valores padrão
    // A busca assíncrona é feita em background para popular o cache
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
    const temperature = options.temperature ?? recommendedParams?.temperature ?? 1.0;
    const topP = options.topP ?? recommendedParams?.topP ?? 0.999;
    const maxTokens = options.maxTokens ?? recommendedParams?.maxTokens ?? 4096;

    const body: Record<string, unknown> = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      messages: conversationMessages,
    };

    // ⚠️ IMPORTANTE: Claude Sonnet 4.5 não aceita temperature e top_p juntos
    // Priorizar temperature se ambos estiverem definidos
    if (temperature !== undefined) {
      body.temperature = temperature;
    } else if (topP !== undefined) {
      body.top_p = topP;
    }

    // Only add top_k if specified (Anthropic doesn't support it officially)
    if (options.topK !== undefined) {
      body.top_k = options.topK;
    }

    if (systemMessage) {
      body.system = systemMessage.content;
    }

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
    // Handle null/undefined chunks
    if (!chunk) {
      return {
        type: 'chunk',
        content: '',
      };
    }

    // Content block delta (text streaming)
    if (chunk.type === 'content_block_delta') {
      const delta = chunk.delta as Record<string, unknown> | undefined;
      if (delta?.text) {
        return {
          type: 'chunk',
          content: delta.text as string,
        };
      }
    }

    // Message stop (end of stream)
    if (chunk.type === 'message_stop') {
      return {
        type: 'done',
      };
    }

    // Error handling
    if (chunk.type === 'error' || chunk.error) {
      const error = chunk.error as Record<string, unknown> | string | undefined;
      return {
        type: 'error',
        error: typeof error === 'string' ? error : (error?.message as string) || (chunk.message as string) || 'Unknown error',
      };
    }

    // Default: empty chunk (ignore other event types)
    return {
      type: 'chunk',
      content: '',
    };
  }
}
