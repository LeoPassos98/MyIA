// backend/src/services/ai/adapters/inference-profile/amazon-profile.adapter.ts
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

  formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    // Format messages for Converse API
    const formattedMessages = conversationMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: [{ text: m.content }],
    }));

    // 🎯 MODO AUTO/MANUAL: Buscar recommendedParams do Model Registry
    const modelDef = options.modelId ? ModelRegistry.getModel(options.modelId) : undefined;
    const recommendedParams = modelDef?.recommendedParams;

    // Aplicar fallback: Manual (options) → Auto (recommendedParams) → Hardcoded defaults
    const temperature = options.temperature ?? recommendedParams?.temperature ?? 0.7;
    const topP = options.topP ?? recommendedParams?.topP ?? 0.9;
    const maxTokens = options.maxTokens ?? recommendedParams?.maxTokens ?? 2048;

    const body: any = {
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
      body.inferenceConfig.stopSequences = options.stopSequences;
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

  parseChunk(chunk: any): AdapterChunk {
    // Nova format (Converse API) - content block delta
    if (chunk.contentBlockDelta?.delta?.text) {
      return {
        type: 'chunk',
        content: chunk.contentBlockDelta.delta.text,
      };
    }

    // Nova format - message stop
    if (chunk.messageStop) {
      return {
        type: 'done',
        metadata: {
          stopReason: chunk.messageStop.stopReason,
        },
      };
    }

    // Error handling
    if (chunk.error || chunk.message?.includes('error')) {
      return {
        type: 'error',
        error: chunk.error || chunk.message || 'Unknown error',
      };
    }

    // Default: empty chunk (ignore other event types)
    return {
      type: 'chunk',
      content: '',
    };
  }
}
