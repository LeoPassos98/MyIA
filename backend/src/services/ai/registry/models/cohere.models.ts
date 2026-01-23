// backend/src/services/ai/registry/models/cohere.models.ts
// Standards: docs/STANDARDS.md

import { ModelRegistry, ModelMetadata } from '../model-registry';

/**
 * Cohere Command models registration
 */
const cohereModels: ModelMetadata[] = [
  // Command R (Official: 128k context)
  {
    modelId: 'cohere.command-r-v1:0',
    vendor: 'cohere',
    displayName: 'Cohere Command R',
    description: 'Optimized for RAG and tool use with 128k context',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: true, // Supports tool use
      maxContextWindow: 128000,
      maxOutputTokens: 4000,
    },
    supportedPlatforms: ['bedrock', 'direct'],
    adapterClass: 'CohereAdapter',
    recommendedParams: {
      temperature: 0.3,
      topP: 0.75,
      topK: 0,
      maxTokens: 2048,
    },
  },

  // Command R+ (Official: 128k context)
  {
    modelId: 'cohere.command-r-plus-v1:0',
    vendor: 'cohere',
    displayName: 'Cohere Command R+',
    description: 'Most capable model with enhanced reasoning and multilingual support',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: true, // Supports tool use
      maxContextWindow: 128000,
      maxOutputTokens: 4000,
    },
    supportedPlatforms: ['bedrock', 'direct'],
    adapterClass: 'CohereAdapter',
    recommendedParams: {
      temperature: 0.3,
      topP: 0.75,
      topK: 0,
      maxTokens: 2048,
    },
  },

  // Command Light
  {
    modelId: 'cohere.command-light-v14',
    vendor: 'cohere',
    displayName: 'Cohere Command Light',
    description: 'Lightweight model for simple tasks',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 4096,
      maxOutputTokens: 4096,
    },
    supportedPlatforms: ['bedrock', 'direct'],
    adapterClass: 'CohereAdapter',
    recommendedParams: {
      temperature: 0.3,
      topP: 0.75,
      topK: 0,
      maxTokens: 2048,
    },
  },

  // Command Text
  {
    modelId: 'cohere.command-text-v14',
    vendor: 'cohere',
    displayName: 'Cohere Command Text',
    description: 'Standard text generation model',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 4096,
      maxOutputTokens: 4096,
    },
    supportedPlatforms: ['bedrock', 'direct'],
    adapterClass: 'CohereAdapter',
    recommendedParams: {
      temperature: 0.3,
      topP: 0.75,
      topK: 0,
      maxTokens: 2048,
    },
  },
];

// Auto-register all models
ModelRegistry.registerMany(cohereModels);

export { cohereModels };
