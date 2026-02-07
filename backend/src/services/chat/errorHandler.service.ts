// backend/src/services/chat/errorHandler.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { StreamChunk } from '../ai/types';
import { logger } from '../../utils/logger';

/**
 * Parâmetros para tratamento de erro de stream
 */
interface HandleStreamErrorParams {
  error: unknown;
  requestId?: string;
  chatId: string;
  userId?: string;
  provider: string;
  model: string;
}

/**
 * Resultado do tratamento de erro
 */
interface ErrorResult {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Service responsável por tratar erros durante o processamento de chat
 * 
 * Responsabilidades:
 * - Extrair informações de erros
 * - Logging estruturado de erros
 * - Formatar mensagens de erro para o usuário
 * - Enviar notificações de erro via SSE
 */
class ErrorHandlerService {
  /**
   * Trata erro durante o stream e retorna informações estruturadas
   */
  handleStreamError(params: HandleStreamErrorParams): ErrorResult {
    const { error, requestId, chatId, userId, provider, model } = params;

    const errorMessage = error instanceof Error ? error.message : 'Erro na geração';
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : undefined;
    const errorStatus = error instanceof Error && 'status' in error ? (error as any).status : undefined;

    // Log estruturado do erro
    logger.error('Erro no stream', {
      requestId,
      chatId,
      userId,
      provider,
      model,
      error: errorMessage,
      errorCode,
      errorStatus,
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      message: errorMessage,
      code: errorCode,
      status: errorStatus
    };
  }

  /**
   * Envia notificação de erro via SSE
   */
  sendErrorNotification(
    errorMessage: string,
    writeSSE: (data: StreamChunk) => void
  ): void {
    writeSSE({
      type: 'error',
      error: errorMessage
    });
  }

  /**
   * Envia log de debug via SSE
   */
  sendDebugLog(
    message: string,
    writeSSE: (data: StreamChunk) => void
  ): void {
    writeSSE({
      type: 'debug',
      log: message
    });
  }

  /**
   * Formata mensagem de erro para exibição ao usuário
   */
  formatUserErrorMessage(error: ErrorResult): string {
    return `[ERRO] ${error.message}`;
  }

  /**
   * Cria objeto de auditoria para erro
   */
  createErrorAudit(
    baseAudit: any,
    error: ErrorResult
  ): any {
    return {
      ...baseAudit,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        type: 'stream_error'
      }
    };
  }

  /**
   * Loga erro ao salvar mensagem de erro
   */
  logSaveErrorFailure(
    error: unknown,
    requestId?: string,
    chatId?: string
  ): void {
    logger.error('Erro ao salvar audit de erro', {
      requestId,
      chatId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

export const errorHandlerService = new ErrorHandlerService();
