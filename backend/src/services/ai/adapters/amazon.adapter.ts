// backend/src/services/ai/adapters/amazon.adapter.ts
// Standards: docs/STANDARDS.md

import {
  BaseModelAdapter,
  Message,
  UniversalOptions,
  AdapterPayload,
  AdapterChunk,
} from './base.adapter';
import { ModelRegistry } from '../registry/model-registry';
import logger from '../../../utils/logger';

/**
 * Adapter for Amazon Titan and Nova models
 *
 * Supports Amazon models on AWS Bedrock:
 * - Amazon Titan (amazon.titan-*) - Uses inputText + textGenerationConfig
 * - Amazon Nova (amazon.nova-*) - Uses messages + inferenceConfig (similar to Anthropic)
 *
 * IMPORTANT: Different Amazon model families use different formats:
 * - Titan: 'inputText' with formatted conversation + 'textGenerationConfig'
 * - Nova: 'messages' array + 'inferenceConfig' (Converse API format)
 */
export class AmazonAdapter extends BaseModelAdapter {
  readonly vendor = 'amazon';
  
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

    // 🎯 MODO AUTO/MANUAL: Buscar recommendedParams do Model Registry
    const modelDef = options.modelId ? ModelRegistry.getModel(options.modelId) : undefined;
    const recommendedParams = modelDef?.recommendedParams;

    // Aplicar fallback: Manual (options) → Auto (recommendedParams) → Hardcoded defaults
    const temperature = options.temperature ?? recommendedParams?.temperature ?? 0.7;
    const topP = options.topP ?? recommendedParams?.topP ?? 0.9;
    const maxTokens = options.maxTokens ?? recommendedParams?.maxTokens ?? 2048;

    const body: any = {
      inputText,
      textGenerationConfig: {
        maxTokenCount: maxTokens,
        temperature: temperature,
        topP: topP,
      },
    };

    if (options.stopSequences && options.stopSequences.length > 0) {
      body.textGenerationConfig.stopSequences = options.stopSequences;
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

  parseChunk(chunk: any): AdapterChunk {
    // Nova format (Converse API) - content block delta
    if (chunk.contentBlockDelta?.delta?.text) {
      return {
        type: 'chunk',
        content: chunk.contentBlockDelta.delta.text,
      };
    }

    // Titan format (legacy) - output text chunk
    if (chunk.outputText) {
      return {
        type: 'chunk',
        content: chunk.outputText,
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
