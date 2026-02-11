// backend/src/services/chat/orchestrator/handlers/SuccessHandler.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Chat } from '@prisma/client';
import { StreamChunk, TelemetryMetrics } from '../../../ai/types';
import { messageProcessorService } from '../../messageProcessor.service';
import { responseFormatterService } from '../../responseFormatter.service';
import { telemetryCollectorService } from '../../telemetryCollector.service';
import { auditBuilderService } from '../../auditBuilder.service';

/**
 * Tipo para mensagem de payload
 */
interface PayloadMessage {
  role: string;
  content: string;
}

/**
 * Tipo para mensagem do usuário
 */
interface UserMessage {
  id: string;
  content: string;
}

/**
 * Tipo para mensagem do assistente salva
 */
interface SavedAssistantMessage {
  id: string;
  content: string;
}

/**
 * Tipo para objeto de auditoria (compatível com auditBuilderService)
 */
type AuditObjectType = Parameters<typeof auditBuilderService.stringify>[0];

/**
 * Parâmetros para processamento de sucesso
 */
export interface SuccessHandlingParams {
  content: string;
  metrics: TelemetryMetrics | null;
  chat: Chat;
  payloadResult: {
    payload: PayloadMessage[];
    totalTokens: number;
    pinnedStepIndices: number[];
    stepOrigins: Record<number, 'pinned' | 'rag' | 'recent' | 'rag+recent' | 'manual'>;
  };
  auditObject: AuditObjectType;
  userMessage: UserMessage;
  isNewChat: boolean;
  messageContent: string;
  userId: string;
  model: string;
  writeSSE: (data: StreamChunk) => void;
  requestId?: string;
}

/**
 * Resultado do processamento de sucesso
 */
export interface SuccessHandlingResult {
  assistantMessage: SavedAssistantMessage;
  telemetry: TelemetryMetrics;
}

/**
 * Handler de resposta bem-sucedida
 * 
 * Responsabilidades:
 * - Calcular métricas fallback se necessário
 * - Salvar mensagem do assistente
 * - Enviar telemetria final
 * - Disparar tarefas assíncronas (embeddings, título)
 */
export class SuccessHandler {
  /**
   * Processa resposta bem-sucedida
   * 
   * @param params - Parâmetros da resposta
   * @returns Mensagem do assistente e telemetria
   */
  async handle(params: SuccessHandlingParams): Promise<SuccessHandlingResult> {
    const {
      content,
      metrics,
      chat,
      payloadResult,
      auditObject,
      userMessage,
      isNewChat,
      messageContent,
      userId,
      model,
      writeSSE,
      requestId
    } = params;

    // 1. Calcula métricas fallback se necessário
    let finalMetrics = metrics;
    if (responseFormatterService.needsRecalculation(metrics)) {
      finalMetrics = await responseFormatterService.calculateFallbackMetrics({
        payload: payloadResult.payload,
        fullContent: content,
        provider: chat.provider,
        model,
        chatId: chat.id
      });
      
      // Envia métricas recalculadas via SSE
      if (finalMetrics) {
        writeSSE({ type: 'telemetry', metrics: finalMetrics });
      }
    }

    // Garante que finalMetrics não é null
    if (!finalMetrics) {
      throw new Error('Failed to calculate metrics');
    }

    // 2. Salva mensagem do assistente
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

    // 3. Envia telemetria final com ID da mensagem
    const telemetryWithId = responseFormatterService.formatTelemetry(
      finalMetrics,
      assistantMessage.id
    );
    writeSSE({ type: 'telemetry', metrics: telemetryWithId });

    // 4. Tarefas assíncronas (fire and forget)
    
    // 4.1 Gera embeddings
    telemetryCollectorService.generateEmbeddings({
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      userContent: messageContent,
      assistantContent: content,
      requestId
    });

    // 4.2 Gera título se chat novo
    if (isNewChat) {
      telemetryCollectorService.generateTitle({
        chatId: chat.id,
        userMessage: messageContent,
        assistantMessage: content,
        userId,
        requestId
      });
    }

    return {
      assistantMessage,
      telemetry: telemetryWithId
    };
  }
}
