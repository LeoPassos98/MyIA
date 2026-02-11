// backend/src/services/models/index.ts
// Standards: docs/STANDARDS.md

// Re-exports do módulo models

// BaseModel Service
export { baseModelService } from './baseModelService';
export type {
  BaseModelCapabilities,
  BaseModelDefaultParams,
  CreateBaseModelData,
  UpdateBaseModelData,
  BaseModelFilters,
  BaseModelQueryOptions,
  PaginatedBaseModels
} from './baseModelService';

// Deployment Service
export { deploymentService, InferenceType } from './deploymentService';
export type {
  ProviderConfig,
  CustomParams,
  CreateDeploymentData,
  UpdateDeploymentData,
  DeploymentFilters,
  DeploymentQueryOptions,
  PaginatedDeployments,
  CostEstimate
} from './deploymentService';

// Model Cache Service
export { modelCacheService } from './modelCacheService';
export type {
  CacheConfig,
  CacheStats
} from './modelCacheService';

// Capability Validation Service
export { capabilityValidationService } from './capabilityValidationService';
export type {
  ModelCapabilities,
  CapabilityComparison,
  ValidationResult,
  BestModelResult
} from './capabilityValidationService';

// Metrics Service
export { metricsService, METRIC_NAMES } from './metricsService';
export type {
  MetricName,
  MetricMetadata,
  CreateMetricData,
  TimeRange,
  MetricQueryOptions,
  AggregationResult,
  TrendDataPoint,
  TrendResult,
  DeploymentComparison,
  ComparisonResult
} from './metricsService';
