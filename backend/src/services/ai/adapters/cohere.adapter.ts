// backend/src/services/ai/adapters/cohere.adapter.ts
// Standards: docs/STANDARDS.md

import {
  BaseModelAdapter,
  Message,
  UniversalOptions,
  AdapterPayload,
  AdapterChunk,
} from './base.adapter';

/**
 * Adapter for Cohere Command models
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
 */
export class CohereAdapter extends BaseModelAdapter {
  readonly vendor = 'cohere';
  
  readonly supportedModels = [
    // AWS Bedrock format (only format currently supported)
    'cohere.command-r-v1:0',
    'cohere.command-r-plus-v1:0',
    'cohere.command-light-v14',
    'cohere.command-text-v14',
    'cohere.command-*', // Wildcard for all Bedrock Cohere models
    
    // Note: Direct API format (command-*) will be added when DirectProvider is implemented
  ];

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
    
    const body: any = {
      message: lastMessage?.content || '',
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 2048,
    };

    // Add chat_history if there are previous messages
    if (chatHistory.length > 0) {
      body.chat_history = chatHistory;
    }

    // Add preamble (equivalent to system message)
    if (systemMessage) {
      body.preamble = systemMessage.content;
    }

    // Cohere supports p (top_p) but not top_k in the same way
    if (options.topP !== undefined) {
      body.p = options.topP;
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

  parseChunk(chunk: any): AdapterChunk {
    // Text chunk
    if (chunk.text) {
      return {
        type: 'chunk',
        content: chunk.text,
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
