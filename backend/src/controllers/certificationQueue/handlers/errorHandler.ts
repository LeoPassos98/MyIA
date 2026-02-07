// backend/src/controllers/certificationQueue/handlers/errorHandler.ts
// Standards: docs/STANDARDS.md

import { Response } from 'express';
import { logger } from '../../../utils/logger';
import { ApiResponse } from '../../../utils/api-response';

/**
 * Contexto do erro para logging
 */
export interface ErrorContext {
  operation: string;
  params?: Record<string, any>;
  userId?: string;
}

/**
 * Handler centralizado de erros para o controller de certificação
 * 
 * Responsabilidades:
 * - Tratar erros de forma consistente em todas as funções do controller
 * - Categorizar erros (Prisma, validação, genéricos)
 * - Fornecer mensagens de erro amigáveis
 * - Fazer logging estruturado de erros
 * - Retornar respostas HTTP apropriadas
 */
export class ErrorHandler {
  /**
   * Trata erro genérico do controller
   * 
   * @param error - Erro capturado
   * @param res - Response do Express
   * @param context - Contexto da operação
   * @returns Response HTTP
   */
  handleControllerError(error: any, res: Response, context: ErrorContext): Response {
    logger.error(`[ErrorHandler] Erro em ${context.operation}`, {
      operation: context.operation,
      params: context.params,
      userId: context.userId,
      errorMessage: error.message,
      errorName: error.name,
      errorCode: error.code,
      stack: error.stack
    });

    // Verificar se é erro do Prisma
    if (error.code && error.code.startsWith('P')) {
      return this.handlePrismaError(error, res);
    }

    // Verificar se é erro de validação
    if (error.name === 'ValidationError' || error.message?.includes('Invalid')) {
      return this.handleValidationError(error, res);
    }

    // Erro genérico
    return res.status(500).json(
      ApiResponse.error(
        error.message || `Failed to ${context.operation}`,
        500
      )
    );
  }

  /**
   * Trata erros específicos do Prisma
   * 
   * @param error - Erro do Prisma
   * @param res - Response do Express
   * @returns Response HTTP
   */
  handlePrismaError(error: any, res: Response): Response {
    logger.error('[ErrorHandler] Erro do Prisma detectado', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });

    // P2023: Invalid UUID format
    if (error.code === 'P2023') {
      return res.status(400).json(
        ApiResponse.error('Invalid ID format', 400)
      );
    }

    // P2025: Record not found
    if (error.code === 'P2025') {
      return res.status(404).json(
        ApiResponse.error('Record not found', 404)
      );
    }

    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      const fields = error.meta?.target || 'fields';
      return res.status(409).json(
        ApiResponse.error(`Duplicate entry for ${fields}`, 409)
      );
    }

    // P2006: Invalid enum value
    if (error.code === 'P2006' || error.message?.includes('Invalid enum value')) {
      return res.status(400).json(
        ApiResponse.error(
          'Invalid filter value. Please check the allowed values for status and type.',
          400
        )
      );
    }

    // Erro genérico do Prisma
    return res.status(500).json(
      ApiResponse.error('Database error occurred', 500)
    );
  }

  /**
   * Trata erros de validação
   * 
   * @param error - Erro de validação
   * @param res - Response do Express
   * @returns Response HTTP
   */
  handleValidationError(error: any, res: Response): Response {
    logger.warn('[ErrorHandler] Erro de validação', {
      message: error.message,
      details: error.details
    });

    return res.status(400).json(
      ApiResponse.error(error.message || 'Validation error', 400)
    );
  }

  /**
   * Trata erro de recurso não encontrado
   * 
   * @param resource - Nome do recurso
   * @param identifier - Identificador do recurso
   * @param res - Response do Express
   * @returns Response HTTP
   */
  handleNotFoundError(resource: string, identifier: string, res: Response): Response {
    logger.warn('[ErrorHandler] Recurso não encontrado', {
      resource,
      identifier
    });

    return res.status(404).json(
      ApiResponse.error(`${resource} not found with ID: ${identifier}`, 404)
    );
  }

  /**
   * Trata erro de parâmetros faltando
   * 
   * @param missingParams - Array de parâmetros faltando
   * @param res - Response do Express
   * @returns Response HTTP
   */
  handleMissingParamsError(missingParams: string[], res: Response): Response {
    logger.warn('[ErrorHandler] Parâmetros faltando', {
      missingParams
    });

    return res.status(400).json(
      ApiResponse.error(
        `Missing required parameters: ${missingParams.join(', ')}`,
        400
      )
    );
  }

  /**
   * Trata erro de autorização
   * 
   * @param message - Mensagem de erro
   * @param res - Response do Express
   * @returns Response HTTP
   */
  handleAuthorizationError(message: string, res: Response): Response {
    logger.warn('[ErrorHandler] Erro de autorização', { message });

    return res.status(403).json(
      ApiResponse.error(message || 'Forbidden', 403)
    );
  }

  /**
   * Trata erro de timeout
   * 
   * @param operation - Operação que sofreu timeout
   * @param res - Response do Express
   * @returns Response HTTP
   */
  handleTimeoutError(operation: string, res: Response): Response {
    logger.error('[ErrorHandler] Timeout', { operation });

    return res.status(504).json(
      ApiResponse.error(`Operation timed out: ${operation}`, 504)
    );
  }
}

// Exportar instância singleton
export const errorHandler = new ErrorHandler();
