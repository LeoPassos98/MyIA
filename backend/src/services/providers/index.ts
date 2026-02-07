// backend/src/services/providers/index.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Barrel export para services de providers
 * Centraliza exports públicos de todos os services
 */

// Services
export { AWSCredentialsService } from './aws-credentials.service';
export { AWSModelsService } from './aws-models.service';
export { VendorAggregationService } from './vendor-aggregation.service';
export { ModelRatingService } from './model-rating.service';
export { ProviderFilterService } from './provider-filter.service';

// Utils
export { ModelParser } from './utils/model-parser';
export { VendorMapper } from './utils/vendor-mapper';

// Types (re-export)
export * from '../../types/providers';
