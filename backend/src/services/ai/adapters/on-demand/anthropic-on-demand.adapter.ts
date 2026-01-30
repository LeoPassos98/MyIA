// backend/src/services/ai/adapters/on-demand/anthropic-on-demand.adapter.ts
// Standards: docs/STANDARDS.md

import {
  BaseModelAdapter,
  Message,
  UniversalOptions,
  AdapterPayload,
  AdapterChunk,
} from '../base.adapter';
import { InferenceType } from '../../types';
import { ModelRegistry } from '../../registry/model-registry';

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

  formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    // 🎯 MODO AUTO/MANUAL: Buscar recommendedParams do Model Registry
    const modelDef = options.modelId ? ModelRegistry.getModel(options.modelId) : undefined;
    const recommendedParams = modelDef?.recommendedParams;

    // Aplicar fallback: Manual (options) → Auto (recommendedParams) → Hardcoded defaults
    const temperature = options.temperature ?? recommendedParams?.temperature ?? 0.7;
    const topP = options.topP ?? recommendedParams?.topP ?? 0.9;
    const maxTokens = options.maxTokens ?? recommendedParams?.maxTokens ?? 2048;

    const body: any = {
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

  parseChunk(chunk: any): AdapterChunk {
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
