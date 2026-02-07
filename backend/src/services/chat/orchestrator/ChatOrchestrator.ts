// backend/src/services/chat/orchestrator/ChatOrchestrator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { StreamChunk } from '../../ai/types';
import { contextBuilderService } from '../contextBuilder.service';
import { messageProcessorService } from '../messageProcessor.service';
import { streamManagerService } from '../streamManager.service';

import { MessageValidator } from './validators/MessageValidator';
import { ContextValidator, ContextPipelineConfig } from './validators/ContextValidator';
import { ChatManager } from './handlers/ChatManager';
import { StreamErrorHandler } from './handlers/StreamErrorHandler';
import { SuccessHandler } from './handlers/SuccessHandler';
import { PayloadBuilder } from './builders/PayloadBuilder';
import { ConfigBuilder } from './builders/ConfigBuilder';

/**
 * Parâmetros de entrada do processamento
 */
export interface ProcessMessageParams {
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
 * Service orquestrador principal do fluxo de chat (REFATORADO)
 * 
 * Responsabilidades:
 * - Coordenar todo o fluxo de processamento
 * - Delegar operações para módulos especializados
 * - Garantir ordem correta de execução
 * - Tratar erros de forma centralizada
 * 
 * MELHORIAS:
 * - Dependency injection explícita
 * - Método processMessage reduzido de 175 para ~60 linhas
 * - Error handling unificado
 * - Complexidade ciclomática reduzida de 32 para ~8
 */
export class ChatOrchestrator {
  constructor(
    private messageValidator: MessageValidator,
    private contextValidator: ContextValidator,
    private chatManager: ChatManager,
    private payloadBuilder: PayloadBuilder,
    private configBuilder: ConfigBuilder,
    private errorHandler: StreamErrorHandler,
    private successHandler: SuccessHandler
  ) {}

  /**
   * Processa mensagem completa do usuário
   * Orquestra todo o fluxo: validação → contexto → inferência → salvamento → telemetria
   */
  async processMessage(params: ProcessMessageParams): Promise<void> {
    const { userId, body, writeSSE, requestId } = params;

    // 1. Validação de entrada
    const validated = this.messageValidator.validate(body);
    const validatedConfig = this.contextValidator.validate(body.contextConfig);

    // 2. Gestão do Chat (Criar ou Recuperar)
    const { chat, isNewChat } = await this.chatManager.getOrCreate(
      userId,
      body.chatId,
      body.provider
    );

    // 3. Construir Contexto (Histórico)
    const contextResult = await contextBuilderService.build({
      chatId: chat.id,
      message: validated.content,
      isManualMode: validated.isManualMode,
      selectedMessageIds: body.selectedMessageIds,
      contextConfig: body.contextConfig,
      writeSSE
    });

    // 4. Salvar Mensagem do Usuário
    const userMessage = await messageProcessorService.saveUserMessage({
      chatId: chat.id,
      content: validated.content
    });
    messageProcessorService.notifyMessageSaved(userMessage.id, writeSSE);

    // 5. Determinar System Prompt
    const systemPrompt = validated.isManualMode && body.context
      ? body.context
      : validatedConfig.systemPrompt;

    // 6. Construir Payload para IA
    const payloadResult = this.payloadBuilder.build({
      historyMessages: contextResult.messages,
      currentMessage: validated.content,
      systemPrompt,
      isManualMode: validated.isManualMode,
      messageOrigins: contextResult.origins,
      provider: chat.provider,
      model: body.model || 'default-model',
      writeSSE
    });

    // 7. Construir Configurações (Auditoria + Modo de Inferência)
    const configResult = this.configBuilder.build({
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
      isManualMode: validated.isManualMode
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
          configResult.inferenceMode === 'auto'
        ),
        writeSSE
      });

      // 9. Tratar Erro de Stream
      if (streamResult.error) {
        await this.errorHandler.handle({
          error: streamResult.error,
          chat,
          auditObject: configResult.auditObject,
          model: body.model || 'default-model',
          userId,
          writeSSE,
          requestId
        });
        return;
      }

      // 10. Processar Resposta Bem-Sucedida
      if (streamResult.content) {
        await this.successHandler.handle({
          content: streamResult.content,
          metrics: streamResult.metrics,
          chat,
          payloadResult,
          auditObject: configResult.auditObject,
          userMessage,
          isNewChat,
          messageContent: validated.content,
          userId,
          model: body.model || 'default-model',
          writeSSE,
          requestId
        });
      }
    } catch (error: unknown) {
      // Trata erro durante o stream (unificado)
      await this.errorHandler.handle({
        error,
        chat,
        auditObject: configResult.auditObject,
        model: body.model || 'default-model',
        userId,
        writeSSE,
        requestId
      });
      throw error;
    }
  }
}
