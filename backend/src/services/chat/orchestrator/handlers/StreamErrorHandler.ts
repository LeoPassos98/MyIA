// backend/src/services/chat/orchestrator/handlers/StreamErrorHandler.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Chat, Message } from '@prisma/client';
import { StreamChunk } from '../../../ai/types';
import { messageProcessorService } from '../../messageProcessor.service';
import { errorHandlerService } from '../../errorHandler.service';

/**
 * Parâmetros para tratamento de erro
 */
export interface ErrorHandlingParams {
  error: unknown;
  chat: Chat;
  auditObject: any;
  model: string;
  userId: string;
  writeSSE: (data: StreamChunk) => void;
  requestId?: string;
}

/**
 * Resultado do tratamento de erro
 */
export interface ErrorHandlingResult {
  errorMessage: Message;
  telemetry: {
    messageId: string;
    chatId: string;
    provider: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    costInUSD: number;
  };
}

/**
 * Handler unificado de erros de stream
 * 
 * Responsabilidades:
 * - Parsear erro usando errorHandlerService
 * - Criar auditoria de erro
 * - Salvar mensagem de erro
 * - Gerar telemetria de erro
 * - Enviar notificações
 * 
 * UNIFICA:
 * - handleStreamError() (linhas 275-313 do original)
 * - Bloco catch (linhas 202-242 do original)
 */
export class StreamErrorHandler {
  /**
   * Trata erro de stream de forma unificada
   * 
   * @param params - Parâmetros do erro
   * @returns Mensagem de erro e telemetria
   */
  async handle(params: ErrorHandlingParams): Promise<ErrorHandlingResult> {
    const {
      error,
      chat,
      auditObject,
      model,
      userId,
      writeSSE,
      requestId
    } = params;

    // 1. Parse erro usando errorHandlerService
    const errorResult = errorHandlerService.handleStreamError({
      error,
      requestId,
      chatId: chat.id,
      userId,
      provider: chat.provider,
      model
    });

    // 2. Cria auditoria de erro
    const errorAudit = errorHandlerService.createErrorAudit(
      auditObject,
      errorResult
    );

    // 3. Salva mensagem de erro
    let errorMessage: any;
    try {
      errorMessage = await messageProcessorService.saveErrorMessage({
        chatId: chat.id,
        error: errorResult.message,
        provider: chat.provider,
        model,
        preflightTokenCount: auditObject.preflightTokenCount,
        auditObject: errorAudit
      }, requestId);
    } catch (saveErr) {
      // Log falha ao salvar erro
      errorHandlerService.logSaveErrorFailure(saveErr, requestId, chat.id);
      throw error; // Re-throw erro original
    }

    // 4. Gera telemetria de erro
    const telemetry = {
      messageId: errorMessage.id,
      chatId: chat.id,
      provider: chat.provider,
      model,
      tokensIn: auditObject.preflightTokenCount || 0,
      tokensOut: 0,
      costInUSD: 0
    };

    // 5. Envia telemetria via SSE
    messageProcessorService.sendTelemetry(telemetry, writeSSE);

    // 6. Envia log de debug
    errorHandlerService.sendDebugLog(
      `❌ Erro salvo com ID: ${errorMessage.id}`,
      writeSSE
    );

    // 7. Envia notificação de erro
    errorHandlerService.sendErrorNotification(errorResult.message, writeSSE);

    return {
      errorMessage,
      telemetry
    };
  }
}
