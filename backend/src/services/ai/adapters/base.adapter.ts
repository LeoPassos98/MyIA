// backend/src/services/ai/adapters/base.adapter.ts
// Standards: docs/STANDARDS.md

import { InferenceType } from '../types';

/**
 * Universal message format (provider-agnostic)
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Universal options for AI requests (provider-agnostic)
 */
export interface UniversalOptions {
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  topP?: number;
  stopSequences?: string[];
  modelId?: string; // Optional: for adapters that need to detect model type
}

/**
 * Adapter payload output (ready to send to platform)
 */
export interface AdapterPayload {
  body: any;
  contentType?: string;
  accept?: string;
}

/**
 * Adapter chunk output (parsed from platform response)
 */
export interface AdapterChunk {
  type: 'chunk' | 'error' | 'done';
  content?: string;
  error?: string;
  metadata?: any;
}

/**
 * Base class for model adapters
 * 
 * Adapters convert between universal format and model-specific format.
 * They are reusable across different platforms (Bedrock, Azure, Direct API, etc.)
 */
export abstract class BaseModelAdapter {
  /**
   * Model vendor name (e.g., 'anthropic', 'cohere', 'amazon')
   */
  abstract readonly vendor: string;

  /**
   * Inference Type (e.g., 'ON_DEMAND', 'INFERENCE_PROFILE')
   * Identifica o tipo de invocação do modelo
   */
  abstract readonly inferenceType: InferenceType;

  /**
   * Supported model IDs for this adapter
   * Supports wildcards (e.g., 'cohere.command-*')
   */
  abstract readonly supportedModels: string[];

  /**
   * Convert universal format to model-specific format
   * 
   * @param messages - Universal message format
   * @param options - Universal options
   * @returns Model-specific payload ready to send
   */
  abstract formatRequest(
    messages: Message[],
    options: UniversalOptions
  ): AdapterPayload;

  /**
   * Parse model-specific response chunk to universal format
   * 
   * @param chunk - Raw chunk from platform
   * @returns Parsed chunk in universal format
   */
  abstract parseChunk(chunk: any): AdapterChunk;

  /**
   * Check if this adapter supports a given model
   * 
   * @param modelId - Model ID to check
   * @returns true if supported
   */
  supportsModel(modelId: string): boolean {
    return this.supportedModels.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(modelId);
      }
      return pattern === modelId;
    });
  }

  /**
   * Get display name for this adapter
   */
  get displayName(): string {
    return `${this.vendor.charAt(0).toUpperCase() + this.vendor.slice(1)} ${this.inferenceType} Adapter`;
  }
}
