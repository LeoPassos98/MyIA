// backend/src/middleware/validators/certificationQueueValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { z } from 'zod';
import { PAGINATION_LIMITS } from '../../config/pagination';

// Regiões AWS Bedrock válidas
const AWS_REGIONS = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1'
] as const;

/**
 * Validador para certificar um modelo único
 */
export const certifyModelSchema = z.object({
  body: z.object({
    modelId: z.string({
      required_error: 'modelId is required',
      invalid_type_error: 'modelId must be a string'
    }).min(1, 'modelId cannot be empty'),
    region: z.enum(AWS_REGIONS, {
      errorMap: () => ({ message: 'Invalid AWS region' })
    })
  })
});

/**
 * Validador para certificar múltiplos modelos
 */
export const certifyMultipleSchema = z.object({
  body: z.object({
    modelIds: z.array(
      z.string().min(1, 'Each modelId must be a non-empty string'),
      {
        required_error: 'modelIds is required',
        invalid_type_error: 'modelIds must be an array'
      }
    ).min(1, 'modelIds must contain at least one model'),
    regions: z.array(
      z.enum(AWS_REGIONS),
      {
        required_error: 'regions is required',
        invalid_type_error: 'regions must be an array'
      }
    ).min(1, 'regions must contain at least one region')
  })
});

/**
 * Validador para certificar todos os modelos
 */
export const certifyAllSchema = z.object({
  body: z.object({
    regions: z.array(
      z.enum(AWS_REGIONS),
      {
        required_error: 'regions is required',
        invalid_type_error: 'regions must be an array'
      }
    ).min(1, 'regions must contain at least one region')
  })
});

/**
 * Validador para jobId nos params
 */
export const jobIdSchema = z.object({
  params: z.object({
    jobId: z.string({
      required_error: 'jobId is required',
      invalid_type_error: 'jobId must be a string'
    }).uuid('jobId must be a valid UUID')
  })
});

/**
 * Status válidos para CertificationJob
 */
const JOB_STATUSES = [
  'PENDING',
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'PAUSED'
] as const;

/**
 * Tipos válidos para CertificationJob
 */
const JOB_TYPES = [
  'SINGLE_MODEL',
  'MULTIPLE_MODELS',
  'ALL_MODELS',
  'RECERTIFY'
] as const;

/**
 * Status válidos para ModelCertification
 * ✅ CORRIGIDO: Adicionado CERTIFIED e QUALITY_WARNING conforme enum Prisma CertificationStatus
 */
const CERTIFICATION_STATUSES = [
  'PENDING',
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'CERTIFIED',       // ✅ Status final de sucesso
  'QUALITY_WARNING'  // ✅ Status para modelos com avisos de qualidade
] as const;

/**
 * Validador para paginação
 */
export const paginationSchema = z.object({
  query: z.object({
    page: z.string()
      .optional()
      .default('1')
      .transform(val => parseInt(val, 10))
      .refine(val => val >= 1, 'page must be a positive integer'),
    limit: z.string()
      .optional()
      .default(String(PAGINATION_LIMITS.DEFAULT))
      .transform(val => parseInt(val, 10))
      .refine(
        val => val >= PAGINATION_LIMITS.MIN && val <= PAGINATION_LIMITS.MAX,
        `limit must be between ${PAGINATION_LIMITS.MIN} and ${PAGINATION_LIMITS.MAX}`
      ),
    status: z.enum(JOB_STATUSES, {
      errorMap: () => ({ message: `Invalid status. Must be one of: ${JOB_STATUSES.join(', ')}` })
    }).optional(),
    type: z.enum(JOB_TYPES, {
      errorMap: () => ({ message: `Invalid type. Must be one of: ${JOB_TYPES.join(', ')}` })
    }).optional()
  })
});

/**
 * Validador para listagem de certificações
 */
export const certificationsQuerySchema = z.object({
  query: z.object({
    page: z.string()
      .optional()
      .default('1')
      .transform(val => parseInt(val, 10))
      .refine(val => val >= 1, 'page must be a positive integer'),
    limit: z.string()
      .optional()
      .default(String(PAGINATION_LIMITS.DEFAULT))
      .transform(val => parseInt(val, 10))
      .refine(
        val => val >= PAGINATION_LIMITS.MIN && val <= PAGINATION_LIMITS.MAX,
        `limit must be between ${PAGINATION_LIMITS.MIN} and ${PAGINATION_LIMITS.MAX}`
      ),
    modelId: z.string().min(1, 'modelId cannot be empty').optional(),  // ✅ CORRIGIDO: Aceita apiModelId (ID da AWS) ao invés de apenas UUID
    region: z.enum(AWS_REGIONS, {
      errorMap: () => ({ message: 'Invalid AWS region' })
    }).optional(),
    status: z.enum(CERTIFICATION_STATUSES, {
      errorMap: () => ({ message: `Invalid status. Must be one of: ${CERTIFICATION_STATUSES.join(', ')}` })
    }).optional()
  })
});
