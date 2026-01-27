// backend/src/middleware/validators/logsValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { z } from 'zod';

/**
 * Schema de validação para query parameters de busca de logs
 * 
 * Query Parameters suportados:
 * - level: Nível do log (info, warn, error, debug)
 * - userId: ID do usuário
 * - requestId: ID da requisição
 * - inferenceId: ID da inferência
 * - startDate: Data início (ISO 8601)
 * - endDate: Data fim (ISO 8601)
 * - search: Busca em message
 * - page: Número da página (default: 1)
 * - limit: Itens por página (default: 20, max: 100)
 * - sort: Ordenação (asc, desc - default: desc)
 */
export const searchLogsSchema = z.object({
  query: z.object({
    // Filtros
    level: z.enum(['info', 'warn', 'error', 'debug'])
      .optional(),
    
    userId: z.string()
      .uuid('userId deve ser um UUID válido')
      .optional(),
    
    requestId: z.string()
      .min(1, 'requestId não pode estar vazio')
      .optional(),
    
    inferenceId: z.string()
      .min(1, 'inferenceId não pode estar vazio')
      .optional(),
    
    startDate: z.string()
      .datetime('startDate deve estar no formato ISO 8601')
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    
    endDate: z.string()
      .datetime('endDate deve estar no formato ISO 8601')
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    
    search: z.string()
      .min(1, 'search não pode estar vazio')
      .max(200, 'search muito longo (máximo 200 caracteres)')
      .optional(),
    
    // Paginação
    page: z.string()
      .optional()
      .transform(val => val ? parseInt(val, 10) : 1)
      .refine(val => val >= 1, 'page deve ser >= 1'),
    
    limit: z.string()
      .optional()
      .transform(val => val ? parseInt(val, 10) : 20)
      .refine(val => val >= 1 && val <= 100, 'limit deve estar entre 1 e 100'),
    
    // Ordenação
    sort: z.enum(['asc', 'desc'])
      .optional()
      .default('desc')
  })
});

/**
 * Schema de validação para busca por ID
 */
export const getLogByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID deve ser um UUID válido')
  })
});

/**
 * Schema de validação para busca por requestId
 */
export const getLogsByRequestIdSchema = z.object({
  params: z.object({
    requestId: z.string().min(1, 'requestId não pode estar vazio')
  })
});

/**
 * Schema de validação para estatísticas de logs
 */
export const getLogStatsSchema = z.object({
  query: z.object({
    startDate: z.string()
      .datetime('startDate deve estar no formato ISO 8601')
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    
    endDate: z.string()
      .datetime('endDate deve estar no formato ISO 8601')
      .optional()
      .transform(val => val ? new Date(val) : undefined)
  })
});
