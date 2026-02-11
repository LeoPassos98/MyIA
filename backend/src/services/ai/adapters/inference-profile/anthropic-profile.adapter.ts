// backend/src/services/ai/adapters/inference-profile/anthropic-profile.adapter.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * @file anthropic-profile.adapter.ts
 * @description Adapter especializado para modelos Anthropic Claude via Inference Profile
 * @module services/ai/adapters/inference-profile
 *
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
 * Adapter para modelos Anthropic Claude 4.x via Inference Profile
 * 
 * Modelos suportados:
 * - Claude Sonnet 4.5 (us.anthropic.claude-sonnet-4-5-20250929-v1:0)
 * - Claude Opus 4 (us.anthropic.claude-opus-4-20250514-v1:0)
 * - Claude Haiku 4 (us.anthropic.claude-haiku-4-20250514-v1:0)
 * 
 * IMPORTANTE: Este adapter NÃO adiciona o prefixo regional.
 * O prefixo é adicionado pelo BedrockProvider usando getInferenceProfileId().
 */
export class AnthropicProfileAdapter extends BaseModelAdapter {
  readonly vendor = 'anthropic';
  readonly inferenceType: InferenceType = 'INFERENCE_PROFILE';
  
  readonly supportedModels = [
    'anthropic.claude-4-*',
    'anthropic.claude-sonnet-4-*',
    'anthropic.claude-opus-4-*',
    'anthropic.claude-haiku-4-*',
  ];

  /**
   * Cache de parâmetros para evitar múltiplas buscas assíncronas
   */
  private paramsCache: Map<string, { temperature?: number; topP?: number; maxTokens?: number }> = new Map();

  /**
   * Verifica se este adapter suporta o modelo
   * 
   * @param modelId - ID do modelo a verificar
   * @returns true se suportado
   */
  supportsModel(modelId: string): boolean {
    // Suporta apenas modelos com inference profile format
    // Formato: {region}.anthropic.claude-{version}-{date}-v1:0
    const profilePattern = /^(us|eu|apac)\.anthropic\.claude-(sonnet|opus|haiku)-4/;
    
    // Também suporta formato sem prefixo regional (será adicionado pelo provider)
    const basePattern = /^anthropic\.claude-(sonnet|opus|haiku)-4/;
    
    return profilePattern.test(modelId) || basePattern.test(modelId);
  }

  /**
   * Busca parâmetros recomendados do banco (com cache)
   *
   * Prioridade:
   * 1. Cache local
   * 2. Banco de dados (via adapterParamsService)
   * 3. Valores hardcoded para Anthropic Claude 4.x
   */
  private async getRecommendedParams(modelId: string): Promise<{ temperature?: number; topP?: number; maxTokens?: number }> {
    // 1. Verificar cache local
    if (this.paramsCache.has(modelId)) {
      return this.paramsCache.get(modelId)!;
    }

    // 2. Tentar buscar do banco via adapterParamsService
    // Nota: Para inference profile, o modelId pode ter prefixo regional
    // Tentamos buscar com e sem o prefixo
    const baseModelId = modelId.replace(/^(us|eu|apac)\./, '');
    
    try {
      // Primeiro tenta com o modelId completo
      let params = await adapterParamsService.getRecommendedParams(modelId, this.vendor);
      if (params.temperature !== undefined || params.topP !== undefined || params.maxTokens !== undefined) {
        this.paramsCache.set(modelId, params);
        return params;
      }
      
      // Se não encontrou, tenta sem o prefixo regional
      params = await adapterParamsService.getRecommendedParams(baseModelId, this.vendor);
      this.paramsCache.set(modelId, params);
      return params;
    } catch {
      logger.debug(`[AnthropicProfileAdapter] Failed to get params from adapterParamsService for ${modelId}`);
    }

    // 3. Valores hardcoded padrão para Anthropic Claude 4.x
    const defaultParams = {
      temperature: 0.7,
      topP: undefined, // Claude 4.x prefere temperature sobre topP
      maxTokens: 4096,
    };
    this.paramsCache.set(modelId, defaultParams);
    return defaultParams;
  }

  /**
   * Formata request para Anthropic via Inference Profile
   * 
   * @param messages - Mensagens no formato universal
   * @param options - Opções universais
   * @returns Payload formatado para Anthropic
   */
  formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    logger.info('Formatting Anthropic Inference Profile request', {
      modelId: options.modelId,
      inferenceType: this.inferenceType,
      messageCount: messages.length,
    });

    // Separar system message das mensagens de conversação
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

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

    // Construir body da requisição
    const body: Record<string, unknown> = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.maxTokens ?? recommendedParams?.maxTokens ?? 4096,
      messages: conversationMessages,
    };

    // Claude 4.x: Priorizar temperature sobre top_p
    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    } else if (options.topP !== undefined) {
      body.top_p = options.topP;
    } else if (recommendedParams?.temperature !== undefined) {
      body.temperature = recommendedParams.temperature;
    } else if (recommendedParams?.topP !== undefined) {
      body.top_p = recommendedParams.topP;
    } else {
      // Valores padrão
      body.temperature = 0.7;
    }

    // Adicionar system message se presente
    if (systemMessage) {
      body.system = systemMessage.content;
    }

    // Adicionar stop sequences se presente
    if (options.stopSequences && options.stopSequences.length > 0) {
      body.stop_sequences = options.stopSequences;
    }

    return {
      body,
      contentType: 'application/json',
      accept: 'application/json',
    };
  }

  /**
   * Parse chunk de streaming
   * 
   * @param chunk - Chunk bruto do Bedrock
   * @returns Chunk parseado no formato universal
   */
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
      const error = chunk.error as Record<string, unknown> | undefined;
      return {
        type: 'error',
        error: (error?.message as string) || (chunk.message as string) || 'Unknown error',
      };
    }

    // Default: empty chunk (ignore other event types)
    return {
      type: 'chunk',
      content: '',
    };
  }
}
