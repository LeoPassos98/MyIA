// backend/src/services/ai/registry/models/amazon/nova-1-premier.models.ts
// Standards: docs/STANDARDS.md

import { ModelMetadata } from '../../model-registry';
import {
  AMAZON_VENDOR,
  AMAZON_ADAPTER,
  AMAZON_PLATFORM,
  DEFAULT_AMAZON_PARAMS,
  INFERENCE_PROFILE_RULE,
} from './shared';

/**
 * Amazon Nova 1.x Premier Models (Linha Premium)
 * 
 * Família de modelos Nova Premier da Amazon:
 * - Variantes de context window: 8k, 20k, 1000k (1M), default (300k)
 * - Variante multimodal (:mm) com suporte a visão
 * 
 * IMPORTANTE: Todos os modelos Premier requerem inference profile
 */
export const novaPremierModels: ModelMetadata[] = [
  // Nova Premier v1 (8k context)
  {
    modelId: 'amazon.nova-premier-v1:0:8k',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Premier (8k)',
    description: 'Premium Nova model with 8k context',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 8000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    platformRules: [INFERENCE_PROFILE_RULE],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova Premier v1 (20k context)
  {
    modelId: 'amazon.nova-premier-v1:0:20k',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Premier (20k)',
    description: 'Premium Nova model with 20k context',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 20000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    platformRules: [INFERENCE_PROFILE_RULE],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova Premier v1 (1000k context - 1M)
  {
    modelId: 'amazon.nova-premier-v1:0:1000k',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Premier (1M)',
    description: 'Premium Nova model with 1 million token context',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 1000000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    platformRules: [INFERENCE_PROFILE_RULE],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova Premier v1 (multimodal)
  {
    modelId: 'amazon.nova-premier-v1:0:mm',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Premier (Multimodal)',
    description: 'Premium Nova model with multimodal capabilities',
    capabilities: {
      streaming: true,
      vision: true, // ← ÚNICO modelo Amazon com vision
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    platformRules: [INFERENCE_PROFILE_RULE],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova Premier v1 (default 300k context)
  {
    modelId: 'amazon.nova-premier-v1:0',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Premier',
    description: 'Premium Nova model with advanced capabilities',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    platformRules: [INFERENCE_PROFILE_RULE],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },
];
