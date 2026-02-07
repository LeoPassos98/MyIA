// backend/src/services/chat/messageProcessor.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
import { StreamChunk } from '../ai/types';
import { logger } from '../../utils/logger';

/**
 * Parâmetros para salvar mensagem do usuário
 */
interface SaveUserMessageParams {
  chatId: string;
  content: string;
}

/**
 * Parâmetros para salvar mensagem do assistente
 */
interface SaveAssistantMessageParams {
  chatId: string;
  content: string;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costInUSD: number;
  sentContext: string;
}

/**
 * Parâmetros para salvar mensagem de erro
 */
interface SaveErrorMessageParams {
  chatId: string;
  error: string;
  provider: string;
  model: string;
  preflightTokenCount: number;
  auditObject: any;
}

/**
 * Resultado do salvamento de mensagem
 */
interface SavedMessage {
  id: string;
  role: string;
  content: string;
  chatId: string;
  provider?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costInUSD?: number;
}

/**
 * Service responsável por processar e persistir mensagens
 * 
 * Responsabilidades:
 * - Salvar mensagens do usuário
 * - Salvar mensagens do assistente (com métricas)
 * - Salvar mensagens de erro (com auditoria)
 * - Logging estruturado de traces
 */
class MessageProcessorService {
  /**
   * Salva mensagem do usuário no banco
   */
  async saveUserMessage(params: SaveUserMessageParams): Promise<SavedMessage> {
    const { chatId, content } = params;

    const message = await prisma.message.create({
      data: {
        role: 'user',
        content,
        chatId
      }
    });

    return message as SavedMessage;
  }

  /**
   * Salva mensagem do assistente com métricas e auditoria
   */
  async saveAssistantMessage(
    params: SaveAssistantMessageParams,
    requestId?: string,
    userId?: string
  ): Promise<SavedMessage> {
    const {
      chatId,
      content,
      provider,
      model,
      tokensIn,
      tokensOut,
      costInUSD,
      sentContext
    } = params;

    const message = await prisma.message.create({
      data: {
        role: 'assistant',
        content,
        chatId,
        provider,
        model,
        tokensIn,
        tokensOut,
        costInUSD,
        sentContext
      }
    });

    // Log estruturado para rastreamento
    logger.info('TRACE_CREATED', {
      traceId: message.id,
      chatId,
      userId,
      provider,
      model,
      tokensIn,
      tokensOut,
      totalTokens: tokensIn + tokensOut,
      costInUSD,
      requestId,
      timestamp: new Date().toISOString()
    });

    return message as SavedMessage;
  }

  /**
   * Salva mensagem de erro com auditoria completa
   */
  async saveErrorMessage(
    params: SaveErrorMessageParams,
    requestId?: string
  ): Promise<SavedMessage> {
    const {
      chatId,
      error,
      provider,
      model,
      preflightTokenCount,
      auditObject
    } = params;

    const errorContent = `[ERRO] ${error}`;
    const errorAuditObject = {
      ...auditObject,
      error: {
        message: error,
        type: 'stream_error'
      }
    };

    const message = await prisma.message.create({
      data: {
        role: 'assistant',
        content: errorContent,
        chatId,
        provider,
        model,
        tokensIn: preflightTokenCount || 0,
        tokensOut: 0,
        costInUSD: 0,
        sentContext: JSON.stringify(errorAuditObject)
      }
    });

    // Log de erro estruturado
    logger.error('ERROR_MESSAGE_SAVED', {
      messageId: message.id,
      chatId,
      provider,
      model,
      error,
      requestId,
      timestamp: new Date().toISOString()
    });

    return message as SavedMessage;
  }

  /**
   * Envia notificação SSE de mensagem salva
   */
  notifyMessageSaved(
    messageId: string,
    writeSSE: (data: StreamChunk) => void
  ): void {
    writeSSE({
      type: 'user_message_saved',
      userMessageId: messageId
    });
  }

  /**
   * Envia telemetria via SSE
   */
  sendTelemetry(
    metrics: {
      messageId: string;
      chatId: string;
      provider: string;
      model: string;
      tokensIn: number;
      tokensOut: number;
      costInUSD: number;
    },
    writeSSE: (data: StreamChunk) => void
  ): void {
    writeSSE({
      type: 'telemetry',
      metrics
    });
  }
}

export const messageProcessorService = new MessageProcessorService();
