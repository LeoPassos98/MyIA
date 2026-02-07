// backend/src/services/chat/orchestrator/builders/PayloadBuilder.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { StreamChunk } from '../../../ai/types';
import { inferenceOrchestratorService } from '../../inferenceOrchestrator.service';

/**
 * Interface para mensagem do histórico
 */
interface HistoryMessage {
  id: string;
  role: string;
  content: string;
  isPinned?: boolean;
}

/**
 * Parâmetros para construção de payload
 */
export interface BuildPayloadParams {
  historyMessages: HistoryMessage[];
  currentMessage: string;
  systemPrompt: string;
  isManualMode: boolean;
  messageOrigins: Record<string, 'pinned' | 'rag' | 'recent' | 'rag+recent' | 'manual'>;
  provider: string;
  model: string;
  writeSSE: (data: StreamChunk) => void;
}

/**
 * Resultado da construção de payload
 */
export interface PayloadResult {
  payload: Array<{ role: string; content: string }>;
  pinnedStepIndices: number[];
  stepOrigins: Record<number, 'pinned' | 'rag' | 'recent' | 'rag+recent' | 'manual'>;
  totalTokens: number;
}

/**
 * Builder de payload para IA
 * 
 * Responsabilidades:
 * - Construir payload usando inferenceOrchestratorService
 * - Validar tokens
 * - Encapsular lógica de preparação de inferência
 */
export class PayloadBuilder {
  /**
   * Constrói payload completo e valida tokens
   * 
   * @param params - Parâmetros de construção
   * @returns Payload construído com metadados
   */
  build(params: BuildPayloadParams): PayloadResult {
    const {
      historyMessages,
      currentMessage,
      systemPrompt,
      isManualMode,
      messageOrigins,
      provider,
      model,
      writeSSE
    } = params;

    // 1. Constrói payload usando inferenceOrchestratorService
    const payloadResult = inferenceOrchestratorService.buildPayload({
      historyMessages,
      currentMessage,
      systemPrompt,
      isManualMode,
      messageOrigins
    });

    // 2. Valida tokens
    inferenceOrchestratorService.validateTokens({
      totalTokens: payloadResult.totalTokens,
      provider,
      model,
      writeSSE
    });

    return payloadResult;
  }
}
