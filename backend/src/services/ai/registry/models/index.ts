// backend/src/services/ai/registry/models/index.ts
// Standards: docs/STANDARDS.md

/**
 * Auto-register all models
 * 
 * This file imports all model registrations, which automatically
 * register themselves in the ModelRegistry.
 */

import './ai21.models';
import './amazon'; // Importa amazon/index.ts automaticamente
import './anthropic.models';
import './cohere.models';
import './google.models';
import './meta.models';
import './minimax.models';
import './mistral.models';
import './moonshot.models';
import './nvidia.models';
import './openai.models';
import './qwen.models';
import './twelvelabs.models';

// Re-export for convenience
export * from './ai21.models';
export * from './amazon'; // Re-exporta amazonModels
export * from './anthropic.models';
export * from './cohere.models';
export * from './google.models';
export * from './meta.models';
export * from './minimax.models';
export * from './mistral.models';
export * from './moonshot.models';
export * from './nvidia.models';
export * from './openai.models';
export * from './qwen.models';
export * from './twelvelabs.models';
