// backend/src/controllers/certificationQueue/validators/payloadValidator.ts
// Standards: docs/STANDARDS.md

import { logger } from '../../../utils/logger';

/**
 * Resultado da validação de payload
 */
export interface PayloadValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
}

/**
 * Validador de payloads de requisições de certificação
 * 
 * Responsabilidades:
 * - Validar payloads de requisições de certificação
 * - Validar parâmetros de URL (jobId, etc.)
 * - Fornecer mensagens de erro descritivas
 */
export class PayloadValidator {
  /**
   * Valida payload para certificação de modelo único
   * 
   * @param body - Corpo da requisição
   * @returns Resultado da validação
   */
  validateCertifyModelPayload(body: any): PayloadValidationResult {
    logger.debug('[PayloadValidator] Validando payload de certifyModel', { body });

    if (!body) {
      return {
        valid: false,
        error: 'Request body is required',
        field: 'body'
      };
    }

    if (!body.modelId || typeof body.modelId !== 'string') {
      return {
        valid: false,
        error: 'modelId is required and must be a string',
        field: 'modelId'
      };
    }

    if (!body.region || typeof body.region !== 'string') {
      return {
        valid: false,
        error: 'region is required and must be a string',
        field: 'region'
      };
    }

    return { valid: true };
  }

  /**
   * Valida payload para certificação de múltiplos modelos
   * 
   * @param body - Corpo da requisição
   * @returns Resultado da validação
   */
  validateMultipleModelsPayload(body: any): PayloadValidationResult {
    logger.debug('[PayloadValidator] Validando payload de certifyMultipleModels', { body });

    if (!body) {
      return {
        valid: false,
        error: 'Request body is required',
        field: 'body'
      };
    }

    if (!body.modelIds || !Array.isArray(body.modelIds)) {
      return {
        valid: false,
        error: 'modelIds must be an array',
        field: 'modelIds'
      };
    }

    if (body.modelIds.length === 0) {
      return {
        valid: false,
        error: 'modelIds must be a non-empty array',
        field: 'modelIds'
      };
    }

    // Validar que todos os elementos são strings
    const invalidModelIds = body.modelIds.filter((id: any) => typeof id !== 'string');
    if (invalidModelIds.length > 0) {
      return {
        valid: false,
        error: 'All modelIds must be strings',
        field: 'modelIds'
      };
    }

    if (!body.regions || !Array.isArray(body.regions)) {
      return {
        valid: false,
        error: 'regions must be an array',
        field: 'regions'
      };
    }

    if (body.regions.length === 0) {
      return {
        valid: false,
        error: 'regions must be a non-empty array',
        field: 'regions'
      };
    }

    // Validar que todas as regiões são strings
    const invalidRegions = body.regions.filter((r: any) => typeof r !== 'string');
    if (invalidRegions.length > 0) {
      return {
        valid: false,
        error: 'All regions must be strings',
        field: 'regions'
      };
    }

    return { valid: true };
  }

  /**
   * Valida payload para certificação de todos os modelos
   * 
   * @param body - Corpo da requisição
   * @returns Resultado da validação
   */
  validateAllModelsPayload(body: any): PayloadValidationResult {
    logger.debug('[PayloadValidator] Validando payload de certifyAllModels', { body });

    if (!body) {
      return {
        valid: false,
        error: 'Request body is required',
        field: 'body'
      };
    }

    if (!body.regions || !Array.isArray(body.regions)) {
      return {
        valid: false,
        error: 'regions must be an array',
        field: 'regions'
      };
    }

    if (body.regions.length === 0) {
      return {
        valid: false,
        error: 'regions must be a non-empty array',
        field: 'regions'
      };
    }

    // Validar que todas as regiões são strings
    const invalidRegions = body.regions.filter((r: any) => typeof r !== 'string');
    if (invalidRegions.length > 0) {
      return {
        valid: false,
        error: 'All regions must be strings',
        field: 'regions'
      };
    }

    return { valid: true };
  }

  /**
   * Valida parâmetro jobId da URL
   * 
   * @param params - Parâmetros da URL
   * @returns Resultado da validação
   */
  validateJobIdParam(params: any): PayloadValidationResult {
    logger.debug('[PayloadValidator] Validando parâmetro jobId', { params });

    if (!params || !params.jobId) {
      return {
        valid: false,
        error: 'jobId parameter is required',
        field: 'jobId'
      };
    }

    const jobId = params.jobId;

    // Validar formato de UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return {
        valid: false,
        error: `Invalid job ID format. Expected UUID, got: ${jobId}`,
        field: 'jobId'
      };
    }

    return { valid: true };
  }

  /**
   * Valida parâmetros de paginação
   * 
   * @param query - Query parameters
   * @returns Resultado da validação com valores parseados
   */
  validatePaginationParams(query: any): {
    valid: boolean;
    error?: string;
    page?: number;
    limit?: number;
  } {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    if (isNaN(page) || page < 1) {
      return {
        valid: false,
        error: 'page must be a positive integer'
      };
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return {
        valid: false,
        error: 'limit must be a positive integer between 1 and 100'
      };
    }

    return {
      valid: true,
      page,
      limit
    };
  }

  /**
   * Valida filtros de status
   * 
   * @param status - Status para filtrar
   * @returns Resultado da validação
   */
  validateStatusFilter(status?: string): PayloadValidationResult {
    if (!status) {
      return { valid: true };
    }

    const validStatuses = [
      'PENDING',
      'QUEUED',
      'PROCESSING',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
      'PAUSED',
      'CERTIFIED',
      'QUALITY_WARNING'
    ];

    if (!validStatuses.includes(status.toUpperCase())) {
      return {
        valid: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        field: 'status'
      };
    }

    return { valid: true };
  }
}

// Exportar instância singleton
export const payloadValidator = new PayloadValidator();
