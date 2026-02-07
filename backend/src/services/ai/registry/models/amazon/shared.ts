// backend/src/services/ai/registry/models/amazon/shared.ts
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

/**
 * Constantes compartilhadas entre todos os modelos Amazon
 */
export const AMAZON_VENDOR = 'amazon';
export const AMAZON_ADAPTER = 'AmazonAdapter';
export const AMAZON_PLATFORM = 'bedrock';

/**
 * Parâmetros recomendados padrão para modelos Amazon
 */
export const DEFAULT_AMAZON_PARAMS = {
  temperature: 0.7,
  topP: 0.9,
  topK: 250,
  maxTokens: 2048,
};

/**
 * Regra de inference profile para modelos que requerem
 */
export const INFERENCE_PROFILE_RULE = {
  platform: 'bedrock' as const,
  rule: 'requires_inference_profile',
  config: {
    profileFormat: '{region}.{modelId}',
  },
};
