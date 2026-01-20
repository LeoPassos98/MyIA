// backend/src/services/ai/adapters/anthropic.adapter.ts
// Standards: docs/STANDARDS.md

import {
  BaseModelAdapter,
  Message,
  UniversalOptions,
  AdapterPayload,
  AdapterChunk,
} from './base.adapter';

/**
 * Adapter for Anthropic Claude models
 * 
 * Supports all Claude models across different platforms:
 * - AWS Bedrock (anthropic.*)
 * - Direct API (claude-*)
 * - Azure (if available)
 */
export class AnthropicAdapter extends BaseModelAdapter {
  readonly vendor = 'anthropic';
  
  readonly supportedModels = [
    // AWS Bedrock format (only format currently supported)
    'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'anthropic.claude-3-5-haiku-20241022-v1:0',
    'anthropic.claude-3-haiku-20240307-v1:0',
    'anthropic.claude-haiku-4-5-20251001-v1:0',
    'anthropic.claude-sonnet-4-20250514-v1:0',
    'anthropic.claude-*', // Wildcard for all Bedrock Claude models
    
    // Note: Direct API format (claude-*) will be added when DirectProvider is implemented
  ];

  formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const body: any = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.maxTokens || 2048,
      messages: conversationMessages,
    };

    // IMPORTANT: Some Claude models don't accept both temperature and top_p
    // Use only temperature by default (more intuitive for users)
    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    } else {
      body.temperature = 0.7; // Default
    }

    // Only add top_k if specified (not all models support it)
    if (options.topK !== undefined) {
      body.top_k = options.topK;
    }

    // Do NOT add top_p if temperature is set (causes conflicts)
    // Only use top_p if explicitly provided AND temperature is not set
    if (options.topP !== undefined && options.temperature === undefined) {
      body.top_p = options.topP;
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
