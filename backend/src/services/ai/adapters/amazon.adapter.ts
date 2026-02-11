// backend/src/services/ai/adapters/amazon.adapter.ts
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
 * Adapter for Amazon Titan and Nova models (Legacy - ON_DEMAND)
 *
 * Supports Amazon models on AWS Bedrock:
 * - Amazon Titan (amazon.titan-*) - Uses inputText + textGenerationConfig
 * - Amazon Nova (amazon.nova-*) - Uses messages + inferenceConfig (similar to Anthropic)
 *
 * IMPORTANT: Different Amazon model families use different formats:
 * - Titan: 'inputText' with formatted conversation + 'textGenerationConfig'
 * - Nova: 'messages' array + 'inferenceConfig' (Converse API format)
 *
 * @deprecated Use AmazonOnDemandAdapter or AmazonProfileAdapter instead
 */
export class AmazonAdapter extends BaseModelAdapter {
  readonly vendor = 'amazon';
  readonly inferenceType: InferenceType = 'ON_DEMAND';
  
  readonly supportedModels = [
    // Titan models
    'amazon.titan-text-express-v1',
    'amazon.titan-text-lite-v1',
    'amazon.titan-text-premier-v1:0',
    'amazon.titan-*', // Wildcard for all Titan models
    
    // Nova models
    'amazon.nova-2-lite-v1:0',
    'amazon.nova-2-lite-v1:0:256k',
    'amazon.nova-2-micro-v1:0',
    'amazon.nova-2-pro-v1:0',
    'amazon.nova-*', // Wildcard for all Nova models
  ];

  /**
   * Cache de parâmetros para evitar múltiplas buscas assíncronas
   */
  private paramsCache: Map<string, { temperature?: number; topP?: number; maxTokens?: number }> = new Map();

  /**
   * Detect if model is Nova (uses Converse API) or Titan (uses legacy format)
   */
  private isNovaModel(modelId?: string): boolean {
    return modelId?.includes('nova') ?? false;
  }

  /**
   * Detect if model is Titan (uses legacy format)
   */
  private isTitanModel(modelId?: string): boolean {
    return modelId?.includes('titan') ?? false;
  }

  /**
   * Busca parâmetros recomendados do banco (com cache)
   *
   * Prioridade:
   * 1. Cache local
   * 2. Banco de dados (via adapterParamsService)
   * 3. Valores hardcoded para Amazon
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
      logger.debug(`[AmazonAdapter] Failed to get params from adapterParamsService for ${modelId}`);
    }

    // 3. Valores hardcoded padrão para Amazon
    const defaultParams = {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2048,
    };
    this.paramsCache.set(modelId, defaultParams);
    return defaultParams;
  }

  formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    const modelId = options.modelId;
    
    // Nova models use Converse API format (similar to Anthropic)
    if (this.isNovaModel(modelId)) {
      return this.formatNovaRequest(messages, options);
    }
    
    // Titan models use legacy format
    if (this.isTitanModel(modelId)) {
      return this.formatTitanRequest(messages, options);
    }
    
    // Default: try Nova format (newer models)
    logger.warn(`[AmazonAdapter] Unknown Amazon model: ${modelId}, using Nova format`);
    return this.formatNovaRequest(messages, options);
  }

  /**
   * Format request for Amazon Nova models (Converse API)
   * Uses messages array + inferenceConfig
   */
  private formatNovaRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
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

    logger.info(`[AmazonAdapter] Nova request format:`, {
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

  /**
   * Format request for Amazon Titan models (legacy format)
   * Uses inputText + textGenerationConfig
   */
  private formatTitanRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    // Amazon Titan uses a single 'inputText' field with formatted conversation
    let inputText = conversationMessages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    // Prepend system message if exists
    if (systemMessage) {
      inputText = `System: ${systemMessage.content}\n\n${inputText}`;
    }

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
      inputText,
      textGenerationConfig: {
        maxTokenCount: maxTokens,
        temperature: temperature,
        topP: topP,
      },
    };

    if (options.stopSequences && options.stopSequences.length > 0) {
      (body.textGenerationConfig as Record<string, unknown>).stopSequences = options.stopSequences;
    }

    logger.info(`[AmazonAdapter] Titan request format:`, {
      modelId: options.modelId,
      inputTextLength: inputText.length,
      textGenerationConfig: body.textGenerationConfig,
    });

    return {
      body,
      contentType: 'application/json',
      accept: 'application/json',
    };
  }

  parseChunk(chunk: Record<string, unknown>): AdapterChunk {
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

    // Titan format (legacy) - output text chunk
    if (chunk.outputText) {
      return {
        type: 'chunk',
        content: chunk.outputText as string,
      };
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

    // Titan format - completion reason (end of stream)
    if (chunk.completionReason) {
      return {
        type: 'done',
        metadata: {
          completionReason: chunk.completionReason,
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
