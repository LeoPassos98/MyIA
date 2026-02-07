// backend/src/services/ai/registry/models/amazon/nova-1-core.models.ts
// Standards: docs/STANDARDS.md

import { ModelMetadata } from '../../model-registry';
import {
  AMAZON_VENDOR,
  AMAZON_ADAPTER,
  AMAZON_PLATFORM,
  DEFAULT_AMAZON_PARAMS,
} from './shared';

/**
 * Amazon Nova 1.x Core Models (Linha Core)
 * 
 * Família de modelos Nova Core da Amazon:
 * - Pro: Profissional (24k, 300k, default)
 * - Lite: Leve (24k, 300k, default)
 * - Micro: Ultra-leve (24k, 128k, default)
 * - Sonic: Ultra-rápido (300k)
 * 
 * IMPORTANTE: Modelos Core NÃO requerem inference profile
 */
export const novaCoreModels: ModelMetadata[] = [
  // ========== Nova Pro v1 ==========
  
  // Nova Pro v1 (24k context)
  {
    modelId: 'amazon.nova-pro-v1:0:24k',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Pro (24k)',
    description: 'Nova Pro with 24k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 24000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova Pro v1 (300k context)
  {
    modelId: 'amazon.nova-pro-v1:0:300k',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Pro (300k)',
    description: 'Nova Pro with extended 300k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova Pro v1 (default)
  {
    modelId: 'amazon.nova-pro-v1:0',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Pro',
    description: 'Professional Nova model',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // ========== Nova Lite v1 ==========
  
  // Nova Lite v1 (24k context)
  {
    modelId: 'amazon.nova-lite-v1:0:24k',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Lite (24k)',
    description: 'Nova Lite with 24k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 24000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova Lite v1 (300k context)
  {
    modelId: 'amazon.nova-lite-v1:0:300k',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Lite (300k)',
    description: 'Nova Lite with extended 300k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova Lite v1 (default)
  {
    modelId: 'amazon.nova-lite-v1:0',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Lite',
    description: 'Lightweight Nova model',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // ========== Nova Micro v1 ==========
  
  // Nova Micro v1 (24k context)
  {
    modelId: 'amazon.nova-micro-v1:0:24k',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Micro (24k)',
    description: 'Nova Micro with 24k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 24000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova Micro v1 (128k context)
  {
    modelId: 'amazon.nova-micro-v1:0:128k',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Micro (128k)',
    description: 'Nova Micro with 128k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 128000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Nova Micro v1 (default)
  {
    modelId: 'amazon.nova-micro-v1:0',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Micro',
    description: 'Ultra-lightweight Nova model',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 128000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // ========== Nova Sonic v1 ==========
  
  // Nova Sonic v1
  {
    modelId: 'amazon.nova-sonic-v1:0',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Nova Sonic',
    description: 'Ultra-fast Nova model for real-time applications',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },
];
