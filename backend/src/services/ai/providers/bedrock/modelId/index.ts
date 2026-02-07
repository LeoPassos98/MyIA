// backend/src/services/ai/providers/bedrock/modelId/index.ts

export { ModelIdNormalizer, KNOWN_SUFFIXES } from './ModelIdNormalizer';

export { InferenceProfileResolver } from './InferenceProfileResolver';
export type { RegionPrefix } from './InferenceProfileResolver';

export { ModelIdVariationGenerator } from './ModelIdVariationGenerator';
export type { VariationType, ModelIdVariation } from './ModelIdVariationGenerator';
