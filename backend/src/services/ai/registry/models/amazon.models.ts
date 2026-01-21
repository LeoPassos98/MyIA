// backend/src/services/ai/registry/models/amazon.models.ts
// Standards: docs/STANDARDS.md

/**
 * SUFIXOS DE CONTEXT WINDOW SUPORTADOS
 *
 * Os modelos Amazon Nova suportam diferentes context windows através de sufixos:
 * - :8k    → 8,000 tokens
 * - :20k   → 20,000 tokens
 * - :24k   → 24,000 tokens
 * - :128k  → 128,000 tokens
 * - :256k  → 256,000 tokens
 * - :300k  → 300,000 tokens
 * - :1000k → 1,000,000 tokens (1M)
 * - :mm    → Multimodal (varia por modelo)
 *
 * IMPORTANTE: AWS Bedrock não aceita sufixos no model ID.
 * O sistema automaticamente remove o sufixo antes de invocar o modelo.
 *
 * Exemplo de normalização:
 *   UI mostra:  amazon.nova-premier-v1:0:8k
 *   AWS recebe: amazon.nova-premier-v1:0 (sem sufixo)
 *
 * A normalização é feita automaticamente pela função normalizeModelId()
 * em backend/src/services/ai/providers/bedrock.ts
 *
 * TRANSPARÊNCIA: O usuário vê o sufixo na UI para escolher o context window
 * desejado, mas a invocação real usa o ID base sem sufixo.
 */

import { ModelRegistry, ModelMetadata } from '../model-registry';

/**
 * Amazon Titan and Nova models registration
 */
const amazonModels: ModelMetadata[] = [
  // Titan Text Express (Official: 8k context)
  {
    modelId: 'amazon.titan-text-express-v1',
    vendor: 'amazon',
    displayName: 'Amazon Titan Text Express',
    description: 'Fast and cost-effective text generation',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 8192,
      maxOutputTokens: 8192,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Titan Text Lite (Official: 4k context)
  {
    modelId: 'amazon.titan-text-lite-v1',
    vendor: 'amazon',
    displayName: 'Amazon Titan Text Lite',
    description: 'Lightweight model for simple tasks',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 4096,
      maxOutputTokens: 4096,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Titan Text Premier (Official: 32k context)
  {
    modelId: 'amazon.titan-text-premier-v1:0',
    vendor: 'amazon',
    displayName: 'Amazon Titan Text Premier',
    description: 'Premium model with enhanced capabilities',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 32768,
      maxOutputTokens: 3072,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Nova 2 Lite
  {
    modelId: 'amazon.nova-2-lite-v1:0',
    vendor: 'amazon',
    displayName: 'Amazon Nova 2 Lite',
    description: 'Next-gen lightweight model',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    platformRules: [
      {
        platform: 'bedrock',
        rule: 'requires_inference_profile',
        config: {
          profileFormat: '{region}.{modelId}',
        },
      },
    ],
    adapterClass: 'AmazonAdapter',
  },

  // Nova 2 Lite (256k context)
  {
    modelId: 'amazon.nova-2-lite-v1:0:256k',
    vendor: 'amazon',
    displayName: 'Amazon Nova 2 Lite (256k)',
    description: 'Nova 2 Lite with extended context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 256000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    platformRules: [
      {
        platform: 'bedrock',
        rule: 'requires_inference_profile',
        config: {
          profileFormat: '{region}.{modelId}',
        },
      },
    ],
    adapterClass: 'AmazonAdapter',
  },

  // Nova 2 Micro
  {
    modelId: 'amazon.nova-2-micro-v1:0',
    vendor: 'amazon',
    displayName: 'Amazon Nova 2 Micro',
    description: 'Ultra-lightweight model for simple tasks',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 128000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    platformRules: [
      {
        platform: 'bedrock',
        rule: 'requires_inference_profile',
        config: {
          profileFormat: '{region}.{modelId}',
        },
      },
    ],
    adapterClass: 'AmazonAdapter',
  },

  // Nova 2 Pro
  {
    modelId: 'amazon.nova-2-pro-v1:0',
    vendor: 'amazon',
    displayName: 'Amazon Nova 2 Pro',
    description: 'Professional-grade model with advanced capabilities',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    platformRules: [
      {
        platform: 'bedrock',
        rule: 'requires_inference_profile',
        config: {
          profileFormat: '{region}.{modelId}',
        },
      },
    ],
    adapterClass: 'AmazonAdapter',
  },

  // Nova 2 Sonic
  {
    modelId: 'amazon.nova-2-sonic-v1:0',
    vendor: 'amazon',
    displayName: 'Amazon Nova 2 Sonic',
    description: 'Ultra-fast model for real-time applications',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    platformRules: [
      {
        platform: 'bedrock',
        rule: 'requires_inference_profile',
        config: {
          profileFormat: '{region}.{modelId}',
        },
      },
    ],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Pro v1 (24k context)
  {
    modelId: 'amazon.nova-pro-v1:0:24k',
    vendor: 'amazon',
    displayName: 'Amazon Nova Pro (24k)',
    description: 'Nova Pro with 24k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 24000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Pro v1 (300k context)
  {
    modelId: 'amazon.nova-pro-v1:0:300k',
    vendor: 'amazon',
    displayName: 'Amazon Nova Pro (300k)',
    description: 'Nova Pro with extended 300k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Pro v1 (default)
  {
    modelId: 'amazon.nova-pro-v1:0',
    vendor: 'amazon',
    displayName: 'Amazon Nova Pro',
    description: 'Professional Nova model',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Lite v1 (24k context)
  {
    modelId: 'amazon.nova-lite-v1:0:24k',
    vendor: 'amazon',
    displayName: 'Amazon Nova Lite (24k)',
    description: 'Nova Lite with 24k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 24000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Lite v1 (300k context)
  {
    modelId: 'amazon.nova-lite-v1:0:300k',
    vendor: 'amazon',
    displayName: 'Amazon Nova Lite (300k)',
    description: 'Nova Lite with extended 300k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Lite v1 (default)
  {
    modelId: 'amazon.nova-lite-v1:0',
    vendor: 'amazon',
    displayName: 'Amazon Nova Lite',
    description: 'Lightweight Nova model',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Micro v1 (24k context)
  {
    modelId: 'amazon.nova-micro-v1:0:24k',
    vendor: 'amazon',
    displayName: 'Amazon Nova Micro (24k)',
    description: 'Nova Micro with 24k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 24000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Micro v1 (128k context)
  {
    modelId: 'amazon.nova-micro-v1:0:128k',
    vendor: 'amazon',
    displayName: 'Amazon Nova Micro (128k)',
    description: 'Nova Micro with 128k context window',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 128000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Micro v1 (default)
  {
    modelId: 'amazon.nova-micro-v1:0',
    vendor: 'amazon',
    displayName: 'Amazon Nova Micro',
    description: 'Ultra-lightweight Nova model',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 128000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Sonic v1
  {
    modelId: 'amazon.nova-sonic-v1:0',
    vendor: 'amazon',
    displayName: 'Amazon Nova Sonic',
    description: 'Ultra-fast Nova model for real-time applications',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Premier v1 (8k context)
  {
    modelId: 'amazon.nova-premier-v1:0:8k',
    vendor: 'amazon',
    displayName: 'Amazon Nova Premier (8k)',
    description: 'Premium Nova model with 8k context',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 8000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    platformRules: [
      {
        platform: 'bedrock',
        rule: 'requires_inference_profile',
        config: {
          profileFormat: '{region}.{modelId}',
        },
      },
    ],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Premier v1 (20k context)
  {
    modelId: 'amazon.nova-premier-v1:0:20k',
    vendor: 'amazon',
    displayName: 'Amazon Nova Premier (20k)',
    description: 'Premium Nova model with 20k context',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 20000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    platformRules: [
      {
        platform: 'bedrock',
        rule: 'requires_inference_profile',
        config: {
          profileFormat: '{region}.{modelId}',
        },
      },
    ],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Premier v1 (1000k context)
  {
    modelId: 'amazon.nova-premier-v1:0:1000k',
    vendor: 'amazon',
    displayName: 'Amazon Nova Premier (1M)',
    description: 'Premium Nova model with 1 million token context',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 1000000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    platformRules: [
      {
        platform: 'bedrock',
        rule: 'requires_inference_profile',
        config: {
          profileFormat: '{region}.{modelId}',
        },
      },
    ],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Premier v1 (multimodal)
  {
    modelId: 'amazon.nova-premier-v1:0:mm',
    vendor: 'amazon',
    displayName: 'Amazon Nova Premier (Multimodal)',
    description: 'Premium Nova model with multimodal capabilities',
    capabilities: {
      streaming: true,
      vision: true,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    platformRules: [
      {
        platform: 'bedrock',
        rule: 'requires_inference_profile',
        config: {
          profileFormat: '{region}.{modelId}',
        },
      },
    ],
    adapterClass: 'AmazonAdapter',
  },

  // Nova Premier v1 (default)
  {
    modelId: 'amazon.nova-premier-v1:0',
    vendor: 'amazon',
    displayName: 'Amazon Nova Premier',
    description: 'Premium Nova model with advanced capabilities',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 300000,
      maxOutputTokens: 5000,
    },
    supportedPlatforms: ['bedrock'],
    platformRules: [
      {
        platform: 'bedrock',
        rule: 'requires_inference_profile',
        config: {
          profileFormat: '{region}.{modelId}',
        },
      },
    ],
    adapterClass: 'AmazonAdapter',
  },
];

// Auto-register all models
ModelRegistry.registerMany(amazonModels);

export { amazonModels };
