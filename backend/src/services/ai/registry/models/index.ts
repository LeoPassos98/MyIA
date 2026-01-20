// backend/src/services/ai/registry/models/index.ts
// Standards: docs/STANDARDS.md

/**
 * Auto-register all models
 * 
 * This file imports all model registrations, which automatically
 * register themselves in the ModelRegistry.
 */

import './anthropic.models';
import './cohere.models';
import './amazon.models';

// Re-export for convenience
export * from './anthropic.models';
export * from './cohere.models';
export * from './amazon.models';
