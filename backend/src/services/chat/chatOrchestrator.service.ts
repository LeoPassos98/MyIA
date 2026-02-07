// backend/src/services/chat/chatOrchestrator.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
import { StreamChunk } from '../ai/types';
import { contextBuilderService } from './contextBuilder.service';
import { inferenceOrchestratorService } from './inferenceOrchestrator.service';
import { messageProcessorService } from './messageProcessor.service';
import { auditBuilderService } from './auditBuilder.service';
import { responseFormatterService } from './responseFormatter.service';
import { errorHandlerService } from './errorHandler.service';
import { streamManagerService } from './streamManager.service';
import { telemetryCollectorService } from './telemetryCollector.service';

/**
 * Configuração do pipeline de contexto
 */
interface ContextPipelineConfig {
  systemPrompt?: string;
  pinnedEnabled?: boolean;
  recentEnabled?: boolean;
  recentCount?: number;
  ragEnabled?: boolean;
  ragTopK?: number;
  maxContextTokens?: number;
}

/**
 * Parâmetros de entrada do processamento
 */
interface ProcessMessageParams {
  userId: string;
  body: {
    message?: string;
    prompt?: string;
    provider?: string;
    chatId?: string;
    model?: string;
    context?: string;
    selectedMessageIds?: string[];
    strategy?: string;
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
    memoryWindow?: number;
    contextConfig?: ContextPipelineConfig;
  };
  writeSSE: (data: StreamChunk) => void;
  requestId?: string;
}

/**
 * Service orquestrador principal do fluxo de chat
 * 
 * Responsabilidades:
 * - Coordenar todo o fluxo de processamento
 * - Gestão de chat (criar/recuperar)
 * - Integrar todos os services modulares
 * - Garantir ordem correta de execução
 * - Tratar erros de forma centralizada
 */
class ChatOrchestratorService {
  /**
   * Processa mensagem completa do usuário
   * Orquestra todo o fluxo: contexto → inferência → salvamento → telemetria
   */
  async processMessage(params: ProcessMessageParams): Promise<void> {
    const { userId, body, writeSSE, requestId } = params;

    // 1. Extrai e valida dados de entrada
    const messageContent = body.prompt || body.message;
    if (!messageContent || typeof messageContent !== 'string' || !messageContent.trim()) {
      throw new Error('Message required');
    }

    // 2. Gestão do Chat (Criar ou Recuperar)
    const { chat, isNewChat } = await this.getOrCreateChat(
      userId,
      body.chatId,
      body.provider
    );

    // 3. Construir Contexto (Histórico)
    const isManualMode = body.context !== undefined || (body.selectedMessageIds && body.selectedMessageIds.length > 0);
    const contextResult = await contextBuilderService.build({
      chatId: chat.id,
      message: messageContent,
      isManualMode: !!isManualMode,
      selectedMessageIds: body.selectedMessageIds,
      contextConfig: body.contextConfig,
      writeSSE
    });

    // 4. Salvar Mensagem do Usuário
    const userMessage = await messageProcessorService.saveUserMessage({
      chatId: chat.id,
      content: messageContent
    });
    messageProcessorService.notifyMessageSaved(userMessage.id, writeSSE);

    // 5. Construir Payload para IA
    const systemPrompt = isManualMode && body.context
      ? body.context
      : (body.contextConfig?.systemPrompt || 'Você é uma IA útil e direta.');

    const payloadResult = inferenceOrchestratorService.buildPayload({
      historyMessages: contextResult.messages,
      currentMessage: messageContent,
      systemPrompt,
      isManualMode: !!isManualMode,
      messageOrigins: contextResult.origins
    });

    // 6. Validar Tokens
    inferenceOrchestratorService.validateTokens({
      totalTokens: payloadResult.totalTokens,
      provider: chat.provider,
      model: body.model || 'default-model',
      writeSSE
    });

    // 7. Construir Auditoria (LEAN - Standards §7)
    const inferenceMode = inferenceOrchestratorService.detectInferenceMode({
      temperature: body.temperature,
      topP: body.topP,
      topK: body.topK,
      maxTokens: body.maxTokens
    });

    const auditObject = auditBuilderService.build({
      historyMessages: contextResult.messages,
      userMessageId: userMessage.id,
      systemPrompt,
      pinnedStepIndices: payloadResult.pinnedStepIndices,
      stepOrigins: payloadResult.stepOrigins,
      preflightTokenCount: payloadResult.totalTokens,
      config: {
        model: body.model || 'default-model',
        provider: chat.provider,
        strategy: body.strategy,
        temperature: body.temperature,
        topP: body.topP,
        topK: body.topK,
        maxTokens: body.maxTokens,
        memoryWindow: body.memoryWindow
      },
      isManualMode: !!isManualMode
    });

    // 8. Processar Stream
    try {
      const streamResult = await streamManagerService.processStream({
        payload: payloadResult.payload,
        options: streamManagerService.prepareInferenceOptions(
          {
            providerSlug: chat.provider,
            modelId: body.model || 'default-model',
            userId
          },
          {
            temperature: body.temperature,
            topP: body.topP,
            topK: body.topK,
            maxTokens: body.maxTokens
          },
          inferenceMode === 'auto'
        ),
        writeSSE
      });

      // 9. Tratar Erro de Stream
      if (streamResult.error) {
        await this.handleStreamError({
          error: streamResult.error,
          chat,
          body,
          auditObject,
          writeSSE,
          requestId
        });
        return;
      }

      // 10. Processar Resposta Bem-Sucedida
      if (streamResult.content) {
        await this.handleSuccessfulResponse({
          content: streamResult.content,
          metrics: streamResult.metrics,
          chat,
          body,
          payloadResult,
          auditObject,
          userMessage,
          isNewChat,
          messageContent,
          userId,
          writeSSE,
          requestId
        });
      }
    } catch (error: unknown) {
      // Trata erro durante o stream
      const errorResult = errorHandlerService.handleStreamError({
        error,
        requestId,
        chatId: chat.id,
        userId,
        provider: chat.provider,
        model: body.model || 'default-model'
      });

      // Salva mensagem de erro
      const errorAudit = errorHandlerService.createErrorAudit(auditObject, errorResult);
      try {
        const errorMessage = await messageProcessorService.saveErrorMessage({
          chatId: chat.id,
          error: errorResult.message,
          provider: chat.provider,
          model: body.model || 'default-model',
          preflightTokenCount: auditObject.preflightTokenCount,
          auditObject: errorAudit
        }, requestId);

        messageProcessorService.sendTelemetry({
          messageId: errorMessage.id,
          chatId: chat.id,
          provider: chat.provider,
          model: body.model || 'default-model',
          tokensIn: auditObject.preflightTokenCount || 0,
          tokensOut: 0,
          costInUSD: 0
        }, writeSSE);

        errorHandlerService.sendDebugLog(`❌ Erro salvo com ID: ${errorMessage.id}`, writeSSE);
      } catch (saveErr) {
        errorHandlerService.logSaveErrorFailure(saveErr, requestId, chat.id);
      }

      errorHandlerService.sendErrorNotification(errorResult.message, writeSSE);
      throw error;
    }
  }

  /**
   * Obtém chat existente ou cria novo
   */
  private async getOrCreateChat(
    userId: string,
    chatId?: string,
    provider?: string
  ): Promise<{ chat: any; isNewChat: boolean }> {
    if (chatId) {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId, userId }
      });
      if (!chat) {
        throw new Error('Chat not found');
      }
      return { chat, isNewChat: false };
    }

    const chat = await prisma.chat.create({
      data: {
        userId,
        provider: provider || 'groq'
      }
    });
    return { chat, isNewChat: true };
  }

  /**
   * Trata erro durante o stream
   */
  private async handleStreamError(params: {
    error: string;
    chat: any;
    body: any;
    auditObject: any;
    writeSSE: (data: StreamChunk) => void;
    requestId?: string;
  }): Promise<void> {
    const { error, chat, body, auditObject, writeSSE, requestId } = params;

    const errorAudit = {
      ...auditObject,
      error: {
        message: error,
        type: 'stream_error'
      }
    };

    const errorMessage = await messageProcessorService.saveErrorMessage({
      chatId: chat.id,
      error,
      provider: chat.provider,
      model: body.model || 'default-model',
      preflightTokenCount: auditObject.preflightTokenCount,
      auditObject: errorAudit
    }, requestId);

    messageProcessorService.sendTelemetry({
      messageId: errorMessage.id,
      chatId: chat.id,
      provider: chat.provider,
      model: body.model || 'default-model',
      tokensIn: auditObject.preflightTokenCount || 0,
      tokensOut: 0,
      costInUSD: 0
    }, writeSSE);

    errorHandlerService.sendDebugLog(`❌ Erro salvo com ID: ${errorMessage.id}`, writeSSE);
  }

  /**
   * Processa resposta bem-sucedida
   */
  private async handleSuccessfulResponse(params: {
    content: string;
    metrics: any;
    chat: any;
    body: any;
    payloadResult: any;
    auditObject: any;
    userMessage: any;
    isNewChat: boolean;
    messageContent: string;
    userId: string;
    writeSSE: (data: StreamChunk) => void;
    requestId?: string;
  }): Promise<void> {
    const {
      content,
      metrics,
      chat,
      body,
      payloadResult,
      auditObject,
      userMessage,
      isNewChat,
      messageContent,
      userId,
      writeSSE,
      requestId
    } = params;

    // Calcula métricas fallback se necessário
    let finalMetrics = metrics;
    if (responseFormatterService.needsRecalculation(metrics)) {
      finalMetrics = responseFormatterService.calculateFallbackMetrics({
        payload: payloadResult.payload,
        fullContent: content,
        provider: chat.provider,
        model: body.model || 'default-model',
        chatId: chat.id
      });
      writeSSE({ type: 'telemetry', metrics: finalMetrics });
    }

    // Salva mensagem do assistente
    const assistantMessage = await messageProcessorService.saveAssistantMessage({
      chatId: chat.id,
      content,
      provider: finalMetrics.provider,
      model: finalMetrics.model,
      tokensIn: finalMetrics.tokensIn,
      tokensOut: finalMetrics.tokensOut,
      costInUSD: finalMetrics.costInUSD,
      sentContext: auditBuilderService.stringify(auditObject)
    }, requestId, userId);

    // Envia telemetria final com ID da mensagem
    const telemetryWithId = responseFormatterService.formatTelemetry(finalMetrics, assistantMessage.id);
    writeSSE({ type: 'telemetry', metrics: telemetryWithId });

    // Tarefas assíncronas (fire and forget)
    telemetryCollectorService.generateEmbeddings({
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      userContent: messageContent,
      assistantContent: content,
      requestId
    });

    if (isNewChat) {
      telemetryCollectorService.generateTitle({
        chatId: chat.id,
        userMessage: messageContent,
        assistantMessage: content,
        userId,
        requestId
      });
    }
  }
}

export const chatOrchestratorService = new ChatOrchestratorService();
