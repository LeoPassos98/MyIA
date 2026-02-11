// backend/src/services/ai/adapters/inference-profile/amazon-profile.adapter.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * REFATORADO: Clean Slate v2 - Fase 7 (Cleanup)
 * - Removido ModelRegistry completamente
 * - Usa adapterParamsService.getRecommendedParams() para buscar parâmetros do banco
 * - Fallback para valores hardcoded específicos do vendor Amazon
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
 * Adapter for Amazon Nova models via Inference Profile
 * 
 * Supports Nova models with regional prefix:
 * - us.amazon.nova-pro-v1:0
 * - us.amazon.nova-lite-v1:0
 * - us.amazon.nova-micro-v1:0
 * - eu.amazon.nova-*
 * - apac.amazon.nova-*
 * 
 * Uses Converse API format (messages + inferenceConfig)
 */
export class AmazonProfileAdapter extends BaseModelAdapter {
  readonly vendor = 'amazon';
  readonly inferenceType: InferenceType = 'INFERENCE_PROFILE';
  
  readonly supportedModels = [
    // Inference Profile format (with regional prefix)
    'us.amazon.nova-pro-v1:0',
    'us.amazon.nova-lite-v1:0',
    'us.amazon.nova-micro-v1:0',
    'us.amazon.nova-2-lite-v1:0',
    'us.amazon.nova-2-lite-v1:0:256k',
    'us.amazon.nova-2-micro-v1:0',
    'us.amazon.nova-2-pro-v1:0',
    'eu.amazon.nova-*',
    'apac.amazon.nova-*',
  ];

  /**
   * Cache de parâmetros para evitar múltiplas buscas assíncronas
   */
  private paramsCache: Map<string, { temperature?: number; topP?: number; maxTokens?: number }> = new Map();

  /**
   * Override supportsModel to only accept Inference Profile format
   */
  supportsModel(modelId: string): boolean {
    // Only accept Inference Profile format (us.amazon.*, eu.amazon.*, etc.)
    if (!/^(us|eu|apac)\.amazon\.nova/i.test(modelId)) {
      return false;
    }

    // Use base implementation for wildcard matching
    return super.supportsModel(modelId);
  }

  /**
   * Busca parâmetros recomendados do banco (com cache)
   *
   * Prioridade:
   * 1. Cache local
   * 2. Banco de dados (via adapterParamsService)
   * 3. Valores hardcoded para Amazon Nova
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
      logger.debug(`[AmazonProfileAdapter] Failed to get params from adapterParamsService for ${modelId}`);
    }

    // 3. Valores hardcoded padrão para Amazon Nova
    const defaultParams = {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2048,
    };
    this.paramsCache.set(modelId, defaultParams);
    return defaultParams;
  }

  formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    // Format messages for Converse API
    const formattedMessages = conversationMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: [{ text: m.content }],
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

    // Aplicar fallback: Manual (options) → Auto (recommendedParams) → Hardcoded defaults
    const temperature = options.temperature ?? recommendedParams?.temperature ?? 0.7;
    const topP = options.topP ?? recommendedParams?.topP ?? 0.9;
    const maxTokens = options.maxTokens ?? recommendedParams?.maxTokens ?? 2048;

    const body: Record<string, unknown> = {
      messages: formattedMessages,
      inferenceConfig: {
        maxTokens: maxTokens,
        temperature: temperature,
        topP: topP,
      },
    };

    // Add system message if exists
    if (systemMessage) {
      body.system = [{ text: systemMessage.content }];
    }

    // Add stop sequences if provided
    if (options.stopSequences && options.stopSequences.length > 0) {
      (body.inferenceConfig as Record<string, unknown>).stopSequences = options.stopSequences;
    }

    logger.info(`[AmazonProfileAdapter] Nova Inference Profile request format:`, {
      modelId: options.modelId,
      messageCount: formattedMessages.length,
      hasSystem: !!systemMessage,
      inferenceConfig: body.inferenceConfig,
    });

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

    // Nova format (Converse API) - content block delta
    const contentBlockDelta = chunk.contentBlockDelta as Record<string, unknown> | undefined;
    if (contentBlockDelta) {
      const delta = contentBlockDelta.delta as Record<string, unknown> | undefined;
      if (delta?.text) {
        return {
          type: 'chunk',
          content: delta.text as string,
        };
      }
    }

    // Nova format - message stop
    if (chunk.messageStop) {
      const messageStop = chunk.messageStop as Record<string, unknown>;
      return {
        type: 'done',
        metadata: {
          stopReason: messageStop.stopReason,
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
