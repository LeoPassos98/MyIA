/**
 * @file anthropic-profile.adapter.ts
 * @description Adapter especializado para modelos Anthropic Claude via Inference Profile
 * @module services/ai/adapters/inference-profile
 */

import {
  BaseModelAdapter,
  Message,
  UniversalOptions,
  AdapterPayload,
  AdapterChunk,
} from '../base.adapter';
import { InferenceType } from '../../types';
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

    // Construir body da requisição
    const body: any = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.maxTokens || 4096,
      messages: conversationMessages,
    };

    // Claude 4.x: Priorizar temperature sobre top_p
    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    } else if (options.topP !== undefined) {
      body.top_p = options.topP;
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
  parseChunk(chunk: any): AdapterChunk {
    // Handle null/undefined chunks
    if (!chunk) {
      return {
        type: 'chunk',
        content: '',
      };
    }

    // Content block delta (text streaming)
    if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
      return {
        type: 'chunk',
        content: chunk.delta.text,
      };
    }

    // Message stop (end of stream)
    if (chunk.type === 'message_stop') {
      return {
        type: 'done',
      };
    }

    // Error handling
    if (chunk.type === 'error' || chunk.error) {
      return {
        type: 'error',
        error: chunk.error?.message || chunk.message || 'Unknown error',
      };
    }

    // Default: empty chunk (ignore other event types)
    return {
      type: 'chunk',
      content: '',
    };
  }
}
