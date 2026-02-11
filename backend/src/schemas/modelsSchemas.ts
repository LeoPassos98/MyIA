// backend/src/schemas/modelsSchemas.ts
// Standards: docs/STANDARDS.md

import { z } from 'zod';
import { InferenceType } from '../services/models';

// ============================================================================
// BASE MODEL SCHEMAS
// ============================================================================

export const baseModelCapabilitiesSchema = z.object({
  streaming: z.boolean().optional(),
  vision: z.boolean().optional(),
  functionCalling: z.boolean().optional(),
  maxContextWindow: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional()
});

export const baseModelDefaultParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().optional()
});

export const createBaseModelSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    vendor: z.string().min(1).max(100),
    family: z.string().max(100).optional(),
    version: z.string().max(50).optional(),
    capabilities: baseModelCapabilitiesSchema,
    defaultParams: baseModelDefaultParamsSchema.optional(),
    description: z.string().max(2000).optional(),
    releaseDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    deprecated: z.boolean().optional(),
    replacedBy: z.string().max(255).optional()
  })
});

export const updateBaseModelSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    vendor: z.string().min(1).max(100).optional(),
    family: z.string().max(100).nullable().optional(),
    version: z.string().max(50).nullable().optional(),
    capabilities: baseModelCapabilitiesSchema.optional(),
    defaultParams: baseModelDefaultParamsSchema.nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    releaseDate: z.string().datetime().nullable().optional().transform(val => val ? new Date(val) : undefined),
    deprecated: z.boolean().optional(),
    replacedBy: z.string().max(255).nullable().optional()
  })
});

export const getBaseModelByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  query: z.object({
    includeDeployments: z.enum(['true', 'false']).optional().transform(val => val === 'true')
  })
});

export const listBaseModelsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    vendor: z.string().optional(),
    family: z.string().optional(),
    deprecated: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    search: z.string().optional(),
    orderBy: z.enum(['name', 'vendor', 'createdAt', 'updatedAt']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    includeDeployments: z.enum(['true', 'false']).optional().transform(val => val === 'true')
  })
});

export const getModelsByProviderSchema = z.object({
  params: z.object({
    providerId: z.string().uuid()
  }),
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
  })
});

export const getModelsByCapabilitiesSchema = z.object({
  query: z.object({
    streaming: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    vision: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    functionCalling: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    minContextWindow: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    minOutputTokens: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20)
  })
});

export const deleteBaseModelSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  query: z.object({
    hard: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    replacedBy: z.string().optional()
  })
});

// ============================================================================
// DEPLOYMENT SCHEMAS
// ============================================================================

export const providerConfigSchema = z.object({
  arn: z.string().optional(),
  profileFormat: z.string().optional(),
  region: z.string().optional()
}).passthrough();

export const customParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().optional()
}).passthrough();

export const createDeploymentSchema = z.object({
  body: z.object({
    baseModelId: z.string().uuid(),
    providerId: z.string().uuid(),
    deploymentId: z.string().min(1).max(500),
    inferenceType: z.nativeEnum(InferenceType).optional(),
    providerConfig: providerConfigSchema.optional(),
    costPer1MInput: z.number().nonnegative(),
    costPer1MOutput: z.number().nonnegative(),
    costPerHour: z.number().nonnegative().optional(),
    customParams: customParamsSchema.optional(),
    isActive: z.boolean().optional()
  })
});

export const updateDeploymentSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    baseModelId: z.string().uuid().optional(),
    providerId: z.string().uuid().optional(),
    deploymentId: z.string().min(1).max(500).optional(),
    inferenceType: z.nativeEnum(InferenceType).optional(),
    providerConfig: providerConfigSchema.nullable().optional(),
    costPer1MInput: z.number().nonnegative().optional(),
    costPer1MOutput: z.number().nonnegative().optional(),
    costPerHour: z.number().nonnegative().nullable().optional(),
    customParams: customParamsSchema.nullable().optional(),
    isActive: z.boolean().optional()
  })
});

export const getDeploymentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  query: z.object({
    includeBaseModel: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    includeProvider: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    includeCertifications: z.enum(['true', 'false']).optional().transform(val => val === 'true')
  })
});

export const listDeploymentsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    baseModelId: z.string().uuid().optional(),
    providerId: z.string().uuid().optional(),
    inferenceType: z.nativeEnum(InferenceType).optional(),
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    search: z.string().optional(),
    orderBy: z.enum(['deploymentId', 'inferenceType', 'createdAt', 'updatedAt', 'costPer1MInput', 'costPer1MOutput']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    includeBaseModel: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    includeProvider: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    includeCertifications: z.enum(['true', 'false']).optional().transform(val => val === 'true')
  })
});

export const getDeploymentsByModelSchema = z.object({
  params: z.object({
    modelId: z.string().uuid()
  }),
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    includeProvider: z.enum(['true', 'false']).optional().transform(val => val === 'true')
  })
});

export const deleteDeploymentSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  query: z.object({
    hard: z.enum(['true', 'false']).optional().transform(val => val === 'true')
  })
});

// ============================================================================
// PROVIDER SCHEMAS
// ============================================================================

export const getProviderByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  query: z.object({
    includeDeployments: z.enum(['true', 'false']).optional().transform(val => val === 'true')
  })
});

export const listProvidersSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    search: z.string().optional()
  })
});

// ============================================================================
// TIPOS PARA QUERY PARAMS TRANSFORMADOS
// ============================================================================

export interface ListModelsQuery {
  page: number;
  limit: number;
  vendor?: string;
  family?: string;
  deprecated?: boolean;
  search?: string;
  orderBy?: 'name' | 'vendor' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  includeDeployments?: boolean;
}

export interface CapabilitiesQuery {
  streaming?: boolean;
  vision?: boolean;
  functionCalling?: boolean;
  minContextWindow?: number;
  minOutputTokens?: number;
  page: number;
  limit: number;
}

export interface ProviderModelsQuery {
  page: number;
  limit: number;
  isActive?: boolean;
}

export interface GetByIdQuery {
  includeDeployments?: boolean;
}

export interface DeleteQuery {
  hard?: boolean;
  replacedBy?: string;
}

export interface ListDeploymentsQuery {
  page: number;
  limit: number;
  baseModelId?: string;
  providerId?: string;
  inferenceType?: typeof InferenceType[keyof typeof InferenceType];
  isActive?: boolean;
  search?: string;
  orderBy?: 'deploymentId' | 'inferenceType' | 'createdAt' | 'updatedAt' | 'costPer1MInput' | 'costPer1MOutput';
  order?: 'asc' | 'desc';
  includeBaseModel?: boolean;
  includeProvider?: boolean;
  includeCertifications?: boolean;
}

export interface DeploymentByIdQuery {
  includeBaseModel?: boolean;
  includeProvider?: boolean;
  includeCertifications?: boolean;
}

export interface DeploymentsByModelQuery {
  page: number;
  limit: number;
  isActive?: boolean;
  includeProvider?: boolean;
}

export interface DeleteDeploymentQuery {
  hard?: boolean;
}

export interface ListProvidersQuery {
  page: number;
  limit: number;
  isActive?: boolean;
  search?: string;
}
