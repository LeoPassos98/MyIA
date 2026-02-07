// backend/src/services/ai/registry/models/amazon/titan.models.ts
// Standards: docs/STANDARDS.md

import { ModelMetadata } from '../../model-registry';
import {
  AMAZON_VENDOR,
  AMAZON_ADAPTER,
  AMAZON_PLATFORM,
  DEFAULT_AMAZON_PARAMS,
} from './shared';

/**
 * Amazon Titan Text Models
 * 
 * Família de modelos Titan da Amazon:
 * - Express: Rápido e econômico (8k context)
 * - Lite: Leve para tarefas simples (4k context)
 * - Premier: Premium com capacidades avançadas (32k context)
 * - TG1 Large: Modelo de grande escala (128k context)
 */
export const titanModels: ModelMetadata[] = [
  // Titan Text Express (Official: 8k context)
  {
    modelId: 'amazon.titan-text-express-v1',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Titan Text Express',
    description: 'Fast and cost-effective text generation',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 8192,
      maxOutputTokens: 8192,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Titan Text Lite (Official: 4k context)
  {
    modelId: 'amazon.titan-text-lite-v1',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Titan Text Lite',
    description: 'Lightweight model for simple tasks',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 4096,
      maxOutputTokens: 4096,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Titan Text Premier (Official: 32k context)
  {
    modelId: 'amazon.titan-text-premier-v1:0',
    vendor: AMAZON_VENDOR,
    displayName: 'Amazon Titan Text Premier',
    description: 'Premium model with enhanced capabilities',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 32768,
      maxOutputTokens: 3072,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },

  // Titan TG1 Large (Official: 128k context)
  {
    modelId: 'amazon.titan-tg1-large',
    vendor: AMAZON_VENDOR,
    displayName: 'Titan Text Large',
    description: 'Auto-generated model configuration',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 128000,
      maxOutputTokens: 4096,
    },
    supportedPlatforms: [AMAZON_PLATFORM],
    adapterClass: AMAZON_ADAPTER,
    recommendedParams: DEFAULT_AMAZON_PARAMS,
  },
];
