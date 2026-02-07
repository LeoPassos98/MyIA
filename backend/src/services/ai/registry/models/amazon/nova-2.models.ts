// backend/src/services/ai/registry/models/amazon/nova-2.models.ts
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
 * Amazon Nova 2.x Models (Nova Geração)
 * 
 * Família de modelos Nova 2.x da Amazon:
 * - Lite: Leve de nova geração (256k/300k context)
 * - Micro: Ultra-leve (128k context)
 * - Pro: Profissional avançado (300k context)
 * - Sonic: Ultra-rápido para aplicações real-time (300k context)
 * 
 * IMPORTANTE: Todos os modelos Nova 2.x requerem inference profile
 */
export const nova2Models: ModelMetadata[] = [
  // Nova 2 Lite (default 300k context)
  {
    modelId: 'amazon.nova-2-lite-v1:0',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova 2 Lite',
    description: 'Next-gen lightweight model',
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

  // Nova 2 Lite (256k context)
  {
    modelId: 'amazon.nova-2-lite-v1:0:256k',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova 2 Lite (256k)',
    description: 'Nova 2 Lite with extended context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 256000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    platformRules: [INFERENCE_PROFILE_RULE],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova 2 Micro
  {
    modelId: 'amazon.nova-2-micro-v1:0',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova 2 Micro',
    description: 'Ultra-lightweight model for simple tasks',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 128000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    platformRules: [INFERENCE_PROFILE_RULE],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova 2 Pro
  {
    modelId: 'amazon.nova-2-pro-v1:0',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova 2 Pro',
    description: 'Professional-grade model with advanced capabilities',
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

  // Nova 2 Sonic
  {
    modelId: 'amazon.nova-2-sonic-v1:0',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova 2 Sonic',
    description: 'Ultra-fast model for real-time applications',
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
